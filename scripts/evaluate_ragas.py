import os
import re
import json
import sys
from datetime import datetime
import numpy as np
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Load .env file
from dotenv import load_dotenv
load_dotenv()

# Verify API key
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    print("Error: MISTRAL_API_KEY environment variable is not set.", file=sys.stderr)
    sys.exit(1)

# Import LangChain and Ragas packages
try:
    from langchain_mistralai import ChatMistralAI, MistralAIEmbeddings
    from ragas import evaluate
    from ragas.llms import LangchainLLMWrapper
    from ragas.embeddings import LangchainEmbeddingsWrapper
    from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
    from datasets import Dataset
    from ragas.run_config import RunConfig
except ImportError as e:
    print(f"Error importing required modules: {e}", file=sys.stderr)
    print("Please ensure you have run pip install ragas langchain-mistralai pandas datasets langchain-openai", file=sys.stderr)
    sys.exit(1)

import time
import asyncio
import threading

class GlobalRateLimiter:
    def __init__(self, delay=2.5):
        self.delay = delay
        self.last_called = 0.0
        self.lock = threading.Lock()
        
    def wait_sync(self):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_called
            if elapsed < self.delay:
                time.sleep(self.delay - elapsed)
            self.last_called = time.time()
            
    async def wait_async(self):
        sleep_time = 0.0
        with self.lock:
            now = time.time()
            elapsed = now - self.last_called
            if elapsed < self.delay:
                sleep_time = self.delay - elapsed
                self.last_called = now + sleep_time
            else:
                self.last_called = now
                
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)

# Global instance with 1.2s spacing
rate_limiter = GlobalRateLimiter(delay=1.2)

class RateLimitedChatMistralAI(ChatMistralAI):
    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        rate_limiter.wait_sync()
        return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)
        
    async def _agenerate(self, messages, stop=None, run_manager=None, **kwargs):
        await rate_limiter.wait_async()
        return await super()._agenerate(messages, stop=stop, run_manager=run_manager, **kwargs)

class RateLimitedMistralAIEmbeddings(MistralAIEmbeddings):
    def embed_documents(self, texts):
        rate_limiter.wait_sync()
        return super().embed_documents(texts)
        
    def embed_query(self, text):
        rate_limiter.wait_sync()
        return super().embed_query(text)
        
    async def aembed_documents(self, texts):
        await rate_limiter.wait_async()
        return await super().aembed_documents(texts)
        
    async def aembed_query(self, text):
        await rate_limiter.wait_async()
        return await super().aembed_query(text)


# Paths to candidate files on desktop
desktop_paths = [
    r'C:\Users\Vivek\Desktop\my certifications\AnnepuJyothiPrabhashResume_extracted.txt',
    r'C:\Users\Vivek\Desktop\my certifications\new_resume-1-_extracted.txt',
    r'C:\Users\Vivek\Desktop\my certifications\jpmorgan_virtual_internship_extracted.txt',
    r'C:\Users\Vivek\Desktop\From my childhood, I always wanted.txt'
]

# Evaluation test dataset
evaluation_questions = [
    "What is Prabhash's major field of study, university, and current GPA?",
    "Describe the projects Prabhash has built using Transformers or Attention models.",
    "Detail Prabhash's virtual internship experience at JPMorgan Chase.",
    "What is ChatPilot and what technologies were used to build it?",
    "What is Brain AI and how does it implement storage and retrieval?",
    "What are Prabhash's childhood inspirations and career goals?"
]

evaluation_ground_truths = [
    "Prabhash is a B.Tech student specializing in AI & ML at Anil Neerukonda Institute of Technology and Sciences, with a GPA of 8.8 / 10.",
    "Prabhash built a 'Transformer Model from Scratch' using Python, NumPy, and TensorFlow. He also developed 'English-to-French Translation with Attention' using a Seq2Seq model with Bahdanau attention under TensorFlow.",
    "Prabhash completed the JPMorgan Chase Software Engineering Job Simulation in January 2026, working as a virtual intern and earning a certificate.",
    "ChatPilot is a B2B AI chatbot for support automation that scrapes web pages to provide context-aware answers. It was built using Python, BeautifulSoup/Selenium, JavaScript, and NLP.",
    "Brain AI is a voice-activated memory assistant with wake-word detection. It stores notes, appointments, and conversations in a Vector Database (FAISS/ChromaDB) and retrieves them using a RAG-like architecture with OpenAI/LLMs.",
    "From childhood, Prabhash wanted to make a big impact on the world, inspired by builders. He chose the AI&ML branch, was inspired by Andrew Ng's Deep Learning specialization, and aims to build an AI company that serves society."
]

def chunk_text(text, size=1100):
    clean = text.replace('\r\n', '\n').strip()
    paragraphs = re.split(r'\n{2,}', clean)
    chunks = []
    current_chunk = ""
    
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if len(p) > size:
            sentences = re.split(r'(?<=[.!?])\s+', p)
            for s in sentences:
                s = s.strip()
                if not s:
                    continue
                if len(current_chunk) + len(s) + 2 <= size:
                    current_chunk = (current_chunk + "\n\n" + s).strip()
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    current_chunk = s
        else:
            if len(current_chunk) + len(p) + 2 <= size:
                current_chunk = (current_chunk + "\n\n" + p).strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = p
                
    if current_chunk:
        chunks.append(current_chunk)
        
    return [c.strip() for c in chunks if len(c.strip()) >= 80]

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def main():
    print("1. Loading candidate documents...")
    all_chunks = []
    
    for path in desktop_paths:
        if not os.path.exists(path):
            print(f"Warning: File not found at {path}", file=sys.stderr)
            continue
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            chunks = chunk_text(content)
            print(f"  Loaded {os.path.basename(path)} ({len(chunks)} chunks)")
            all_chunks.extend(chunks)
        except Exception as e:
            print(f"Error reading {path}: {e}", file=sys.stderr)
            
    if not all_chunks:
        print("Error: No candidate context could be loaded from desktop files.", file=sys.stderr)
        sys.exit(1)
        
    print(f"Total chunks loaded: {len(all_chunks)}")
    
    print("2. Initializing Mistral AI Embeddings...")
    embeddings_model = RateLimitedMistralAIEmbeddings(
        model="mistral-embed", 
        api_key=MISTRAL_API_KEY
    )
    
    print("3. Generating embeddings for chunks...")
    chunk_embeddings = embeddings_model.embed_documents(all_chunks)
    
    print("4. Simulating RAG retrieval and generation for evaluation questions...")
    llm = RateLimitedChatMistralAI(
        model="mistral-small-latest",
        api_key=MISTRAL_API_KEY,
        temperature=0.0
    )
    
    retrieved_contexts = []
    generated_answers = []
    
    for i, q in enumerate(evaluation_questions):
        print(f"  Processing question {i+1}/{len(evaluation_questions)}: '{q}'")
        # Embed question
        q_embedding = embeddings_model.embed_query(q)
        
        # Compute cosine similarity with all chunks
        similarities = [cosine_similarity(q_embedding, ce) for ce in chunk_embeddings]
        
        # Sort and select top 3 chunks
        top_indices = np.argsort(similarities)[::-1][:3]
        top_chunks = [all_chunks[idx] for idx in top_indices if similarities[idx] > 0.15]
        
        # Fallback to top 2 if everything is below threshold
        if not top_chunks:
            top_chunks = [all_chunks[idx] for idx in np.argsort(similarities)[::-1][:2]]
            
        retrieved_contexts.append(top_chunks)
        
        # Generate Answer
        context_str = "\n\n".join([f"[Chunk {idx+1}]: {chunk}" for idx, chunk in enumerate(top_chunks)])
        prompt = (
            f"You are a professional assistant. Answer the user's question accurately using ONLY the provided context. "
            f"Keep your response concise, factual, and strictly aligned with the context. If you cannot answer based on the context, say 'I do not have enough information to answer.'\n\n"
            f"Context:\n{context_str}\n\n"
            f"Question: {q}\n\n"
            f"Answer:"
        )
        
        try:
            response = llm.invoke(prompt)
            generated_answers.append(response.content.strip())
        except Exception as e:
            print(f"  Error generating answer for question {i+1}: {e}", file=sys.stderr)
            generated_answers.append("Error generating answer.")
            
    print("5. Formatting dataset for Ragas...")
    dataset_dict = {
        "question": evaluation_questions,
        "contexts": retrieved_contexts,
        "answer": generated_answers,
        "ground_truth": evaluation_ground_truths
    }
    dataset = Dataset.from_dict(dataset_dict)
    
    print("6. Initializing Ragas Evaluator (using mistral-large-latest as judge)...")
    ragas_llm = LangchainLLMWrapper(RateLimitedChatMistralAI(model="mistral-large-latest", api_key=MISTRAL_API_KEY))
    ragas_embeddings = LangchainEmbeddingsWrapper(embeddings_model)
    
    print("7. Running evaluation metrics...")
    try:
        run_config = RunConfig(max_workers=1, timeout=600)
        eval_result = evaluate(
            dataset=dataset,
            metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
            llm=ragas_llm,
            embeddings=ragas_embeddings,
            run_config=run_config
        )
    except Exception as e:
        print(f"Error during Ragas evaluation: {e}", file=sys.stderr)
        sys.exit(1)
        
    print("\n=== EVALUATION RESULTS ===")
    print(eval_result)
    
    # Calculate overall Ragas score as simple mean of all scores
    avg_scores = {}
    if hasattr(eval_result, "scores") and isinstance(eval_result.scores, list) and eval_result.scores:
        metrics_keys = eval_result.scores[0].keys()
        for k in metrics_keys:
            vals = [row[k] for row in eval_result.scores if k in row and row[k] is not None and not np.isnan(row[k])]
            avg_scores[k] = float(np.mean(vals)) if vals else 0.0
            
    if avg_scores:
        overall_score = float(np.mean(list(avg_scores.values())))
    else:
        overall_score = 0.0
        
    run_entry = {
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "overall_score": overall_score,
            "faithfulness": avg_scores.get("faithfulness", 0.0),
            "answer_relevancy": avg_scores.get("answer_relevancy", 0.0),
            "context_precision": avg_scores.get("context_precision", 0.0),
            "context_recall": avg_scores.get("context_recall", 0.0)
        },
        "results": []
    }
    
    # Parse individual results from the evaluation output DataFrame
    df = eval_result.to_pandas()
    for idx, row in df.iterrows():
        run_entry["results"].append({
            "question": row["question"],
            "contexts": row["contexts"],
            "answer": row["answer"],
            "ground_truth": row["ground_truth"],
            "scores": {
                "faithfulness": float(row["faithfulness"]) if not np.isnan(row["faithfulness"]) else 0.0,
                "answer_relevancy": float(row["answer_relevancy"]) if not np.isnan(row["answer_relevancy"]) else 0.0,
                "context_precision": float(row["context_precision"]) if not np.isnan(row["context_precision"]) else 0.0,
                "context_recall": float(row["context_recall"]) if not np.isnan(row["context_recall"]) else 0.0
            }
        })
        
    # Read history
    data_dir = os.path.join("src", "data")
    os.makedirs(data_dir, exist_ok=True)
    history_file = os.path.join(data_dir, "ragas_evaluations.json")
    
    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except Exception as e:
            print(f"Warning: Could not read history file: {e}", file=sys.stderr)
            
    history.append(run_entry)
    
    # Keep history to max 20 runs
    if len(history) > 20:
        history = history[-20:]
        
    try:
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2)
        print(f"\nSaved evaluation run to {history_file}")
    except Exception as e:
        print(f"Error saving results: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
