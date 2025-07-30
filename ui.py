import gradio as gr
from datetime import datetime
from rag import RAG  # Import your RAG class

# Replace this with your own available models
AVAILABLE_LLM_MODELS = [
    "tinyllama:latest",
    "qwen3:0.6b",
    "smollm2:360m",
    "qwen2.5-coder:0.5b"
]

# Initialize RAG object
rag_system = RAG()
current_model = None
current_pdf = None

def extract_thinking_and_answer(full_response):
    """Extract thinking process and actual answer from response"""
    if "<think>" in full_response and "</think>" in full_response:
        thinking_start = full_response.find("<think>") + len("<think>")
        thinking_end = full_response.find("</think>")
        thinking = full_response[thinking_start:thinking_end].strip()
        answer = full_response[thinking_end + len("</think>"):].strip()
        return thinking, answer
    return None, full_response

async def answer_question_with_llm(pdf_path, question, llm_choice):
    global rag_system, current_model, current_pdf
    try:
        if current_model != llm_choice:
            yield f"Loading model: {llm_choice}\n"
            rag_system.load_model(llm_choice)
            current_model = llm_choice
        if pdf_path and current_pdf != pdf_path:
            yield f"Ingesting PDF: {pdf_path}\n"
            rag_system.ingest_pdf(pdf_path)
            current_pdf = pdf_path
        if pdf_path:
            async for chunk in rag_system.context_answer(question):
                yield chunk  # Yield the chunk directly (it's a string)
        else:
            async for chunk in rag_system.answer(question):
                yield chunk  # Yield the chunk directly (it's a string)
    except Exception as e:
        yield f"Error: {str(e)}\n"

async def process(pdf, question, llm_choice):
    if not question or not llm_choice:
        yield gr.update(visible=False), "", "", ""
        return
    
    thinking_content = ""
    answer_content = ""
    thinking_visible = False
    logistic_content = ""
    
    async for chunk in answer_question_with_llm(pdf.name if pdf else None, question, llm_choice):
        if "<think>" in chunk and "</think>" in chunk:
            thinking, answer = extract_thinking_and_answer(chunk)
            if thinking:  # Only show thinking if there is valid thinking content
                thinking_content = f"### 🧠 Model's Thinking Process\n\n{thinking}\n\n---"
                thinking_visible = True
            else:
                thinking_content = ""  # Clear thinking content if no valid thinking
                thinking_visible = False
            answer_content = f"### Answer\n\n{answer}" if answer else ""
        elif 'Loading model:' in chunk or 'Ingesting PDF:' in chunk:
            logistic_content = chunk
        else:
            # If no thinking tags, treat chunk as answer content
            answer_content += chunk + "\n"
            thinking_visible = False  # Hide thinking accordion if no thinking tags
        
        yield gr.update(visible=thinking_visible), "", thinking_content, answer_content, gr.update(value=logistic_content, visible=bool(logistic_content != ""))

def clear_thinking():
    """Clear the thinking and answer display"""
    return gr.update(visible=False), "", ""

def reset_rag_system():
    """Reset the RAG system state"""
    global current_model, current_pdf
    current_model = None
    current_pdf = None
    return gr.update(visible=False), "", ""

with gr.Blocks(css="""
    .thinking-container {
        max-height: 800px;
        overflow-y: auto;
        border: 1px solid #4a4a4a;
        border-radius: 8px;
        padding: 16px;
        background-color: #2a2a2a; /* Dark background */
        color: #e0e0e0; /* Light text color */
    }
    .gradio-container, .gr-markdown {
        background-color: #1a1a1a !important; /* Darker background */
        color: #e0e0e0 !important; /* Light text for answer/thinking */
    }
    .btn-primary, .btn-secondary, .btn-stop {
        background-color: #4a90e2 !important; /* Blue for buttons */
        color: #ffffff !important; /* White text for buttons */
        border: none !important;
    }
    .btn-primary:hover, .btn-secondary:hover, .btn-stop:hover {
        background-color: #357abd !important; /* Slightly darker blue on hover */
    }
    select.dropdown {
        background-color: #333333 !important; /* Dark grey for dropdown */
        color: #e0e0e0 !important; /* Light text for dropdown */
        border: 1px solid #4a4a4a !important;
    }
    .file-upload {
        background-color: #333333 !important; /* Dark grey for file input */
        color: #e0e0e0 !important; /* Light text for file input */
        border: 1px solid #4a4a4a !important;
    }
""") as demo:
    
    gr.Markdown("## PDF Q&A with RAG System")
    gr.Markdown("*Upload a PDF (optional), select an LLM model, and ask questions.*")
    
    with gr.Row():
        with gr.Column(scale=1):
            pdf_input = gr.File(label="Upload PDF (Optional)", file_types=[".pdf"])
            question_input = gr.Textbox(
                label="Enter your question", 
                placeholder="Ask a question...",
                lines=2
            )
            llm_dropdown = gr.Dropdown(
                choices=AVAILABLE_LLM_MODELS, 
                label="Choose LLM model to answer",
                value=AVAILABLE_LLM_MODELS[0] if AVAILABLE_LLM_MODELS else None
            )
            
            with gr.Row():
                submit_btn = gr.Button("Get Answer", variant="primary")
                clear_btn = gr.Button("Clear Thinking", variant="secondary")
                reset_btn = gr.Button("Reset RAG System", variant="stop")
            
            thinking = gr.Accordion("Thinking Process", open=True, visible=False)  # Initially hidden
            with thinking:
                thinking_content = gr.Markdown(
                    value="", 
                    visible=True,
                    elem_classes=["thinking-container"]
                )
        
        with gr.Column(scale=1):         
            notif = gr.Textbox(visible=False)   
            answer_content = gr.Markdown(
                value="", 
                visible=True,
                elem_classes=["thinking-container"]
            )

    clear_btn.click(
        fn=clear_thinking,
        inputs=[],
        outputs=[thinking, thinking_content, answer_content]
    )
    
    reset_btn.click(
        fn=reset_rag_system,
        inputs=[],
        outputs=[thinking, thinking_content, answer_content]
    )
    
    submit_btn.click(
        fn=process,
        inputs=[pdf_input, question_input, llm_dropdown],
        outputs=[thinking, question_input, thinking_content, answer_content, notif]
    )

    question_input.submit(
        fn=process,
        inputs=[pdf_input, question_input, llm_dropdown],
        outputs=[thinking, question_input, thinking_content, answer_content]
    )

if __name__ == "__main__":
    demo.launch(share=True)