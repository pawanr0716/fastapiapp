import os 
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
load_dotenv()
# Initialize LLM only if GROQ_API_KEY is provided to avoid import-time failures during local dev/tests
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
resume_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a resume analyser.
     Analyse the following resume and provide:
     1. Key Skills found
     2. Experience Level (Junior/Mid/Senior)
     2.Strengths
     4.Areas to Improve
     5. Suggested Job Roles
     keep the analysis short and structured."""),
    ("human", "{resume_text}")
])

resume_chain = None
if llm is not None:
    resume_chain = resume_prompt | llm


def analyse_resume(resume_text: str) -> str:
    # If LLM is not available (missing API key), return a lightweight mock analysis
    if resume_chain is None:
        # Simple heuristic mock: pick first 500 chars and return as 'analysis'
        snippet = (resume_text or "").strip()
        snippet = snippet[:500] + ("..." if len(snippet) > 500 else "")
        return f"(Mock analysis - GROQ_API_KEY not set)\n\nExtracted snippet:\n{snippet}"

    response = resume_chain.invoke({"resume_text": resume_text})
    return response.content