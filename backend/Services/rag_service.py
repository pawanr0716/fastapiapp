import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from backend.Services.qdrant_service import search_jobs

load_dotenv()
# Lazy-init LLM to avoid import-time failures when GROQ_API_KEY is not set
_GROQ_KEY = os.getenv("GROQ_API_KEY")
llm = None
if _GROQ_KEY:
    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=_GROQ_KEY,
            temperature=0.3,
        )
    except Exception:
        llm = None

rag_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a job search assistant.
Use the following job listings retrieved from the database to
answer the user's question.
If no relevant jobs are found, say so clearly.

Retrieved Jobs:
{context}"""),
    ("human", "{question}")
])

rag_chain = None
if llm is not None:
    rag_chain = rag_prompt | llm


def rag_job_search(question: str) -> str:
    results = search_jobs(question, top_k=5)

    if not results:
        return "No jobs found in the database. Please embed jobs first using the /rag/embed-jobs endpoint."
    context = "\n".join([
        f"- {r['title']}: {r['description']} (Salary: {r['salary']}, Match: {r['score']})"
        for r in results
    ])

    if rag_chain is None:
        # Return a simple synthesized response when LLM is not available
        return f"(Mock RAG response - GROQ_API_KEY not set)\n\nFound {len(results)} matching jobs:\n" + "\n".join([
            f"- {r['title']} (Score: {r['score']})" for r in results
        ])

    response = rag_chain.invoke({"context": context, "question": question})
    return response.content