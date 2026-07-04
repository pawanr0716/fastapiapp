import os
from typing import Dict, List
from dotenv import load_dotenv

from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableWithMessageHistory
from langchain_groq import ChatGroq

API_KEY = os.getenv("GROQ_API_KEY", "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")
LLAMA_MODEL = "llama-3.3-70b-versatile"

llm = ChatGroq(model=LLAMA_MODEL, groq_api_key=API_KEY)


def chat_without_memory(query: str) -> str:
    response = llm.invoke(query)
    return response.content


conversation: List[HumanMessage | AIMessage] = []


def chat_with_memory(user_query: str) -> str:
    conversation.append(HumanMessage(content=user_query))
    response = llm.invoke(conversation)
    conversation.append(AIMessage(content=response.content))
    return response.content


prompt_with_memory = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful assistant."),
        ("placeholder", "{chat_history}"),
        ("human", "{user_query}"),
    ]
)

chain_with_memory = prompt_with_memory | llm

store: Dict[str, ChatMessageHistory] = {}


def get_history(session_id: str) -> ChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


chat_with_memory_chain = RunnableWithMessageHistory(
    runnable=chain_with_memory,
    get_session_history=get_history,
    input_messages_key="user_query",
    message_history_key="chat_history",
)


def get_chat_response(user_query: str, session_id: str = "default") -> str:
    response = chat_with_memory_chain.invoke(
        {"user_query": user_query},
        {"configurable": {"session_id": session_id}},
    )
    return response.content