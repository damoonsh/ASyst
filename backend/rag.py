import os
import asyncio
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain.chains.question_answering import load_qa_chain
from langchain_ollama import ChatOllama


class RAG:
    def __init__(self):
        self.vectorstore = None
        self.retriever = None
        self.llm = None
        self.persist_directory = "./chroma_persist_dir"
        self.collection_name = "pdf_documents"
        self.embedding_model_name = "all-minilm" 
        self.embedding_function = None

    def ingest_pdf(self, pdf_path: str):
        if self.embedding_function is None:
            self.embedding_function = OllamaEmbeddings(model=self.embedding_model_name)

        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=100)
        chunks = splitter.split_documents(documents)

        if self.vectorstore is None:
            self.vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=self.embedding_function,
                persist_directory=self.persist_directory,
                collection_name=self.collection_name,
            )
        else:
            self.vectorstore.add_documents(chunks)

        self.retriever = self.vectorstore.as_retriever()

    def load_model(self, model_name: str):
        # Lazily create the Ollama Chat model from LangChain integration
        self.llm = ChatOllama(model=model_name, temperature=0)
        
    async def generate_question(self, question: str):
        async for chunk in self.llm.astream(f'write a maximum 6 word title for this question: {question[:100]}'):
            yield chunk.content

    async def answer(self, question: str):
        async for chunk in self.llm.astream(question):
            yield chunk.content

    async def context_answer(self, question: str):
        if self.vectorstore is None or self.retriever is None:
            raise RuntimeError("Ingest at least one PDF document to build context.")

        if self.llm is None:
            raise RuntimeError("Load an Ollama model first using load_model().")

        relevant_docs = self.retriever.get_relevant_documents(question)

        chain = load_qa_chain(self.llm, chain_type="stuff")
        async for chunk in chain.astream({"input_documents": relevant_docs, "question": question}):
            yield chunk["output_text"]