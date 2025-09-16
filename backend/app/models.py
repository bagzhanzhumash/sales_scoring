"""
Pydantic models for the speech recognition service.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from enum import Enum


class AudioFormat(str, Enum):
    """Supported audio formats."""
    MP3 = "mp3"
    WAV = "wav"
    M4A = "m4a"
    FLAC = "flac"
    OGG = "ogg"


class TranscriptionRequest(BaseModel):
    """Request model for single audio file transcription."""
    language: Optional[str] = Field(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified")
    task: str = Field("transcribe", description="Task type: 'transcribe' or 'translate'")
    word_timestamps: bool = Field(False, description="Enable word-level timestamps")
    initial_prompt: Optional[str] = Field(None, description="Initial prompt for the model")


class TranscriptionResponse(BaseModel):
    """Response model for transcription."""
    text: str = Field(..., description="Transcribed text")
    language: str = Field(..., description="Detected language")
    duration: float = Field(..., description="Audio duration in seconds")
    segments: Optional[List[dict]] = Field(None, description="Detailed segments with timestamps")
    words: Optional[List[dict]] = Field(None, description="Word-level timestamps if enabled")


class BatchTranscriptionRequest(BaseModel):
    """Request model for batch audio files transcription."""
    files: List[str] = Field(..., description="List of file paths or URLs")
    language: Optional[str] = Field(None, description="Language code (e.g., 'ru', 'en'). Auto-detect if not specified")
    task: str = Field("transcribe", description="Task type: 'transcribe' or 'translate'")
    word_timestamps: bool = Field(False, description="Enable word-level timestamps")
    initial_prompt: Optional[str] = Field(None, description="Initial prompt for the model")


class BatchTranscriptionResponse(BaseModel):
    """Response model for batch transcription."""
    results: List[TranscriptionResponse] = Field(..., description="List of transcription results")
    total_files: int = Field(..., description="Total number of files processed")
    successful_files: int = Field(..., description="Number of successfully processed files")
    failed_files: int = Field(..., description="Number of failed files")
    errors: List[dict] = Field(default_factory=list, description="List of errors for failed files")


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether the Whisper model is loaded")
    version: str = Field(..., description="Service version")


class SummaryFormat(str, Enum):
    """Supported formats for generated summaries."""
    PARAGRAPH = "paragraph"
    BULLET = "bullet"


class SummarizationRequest(BaseModel):
    """Request model for text summarization."""
    text: str = Field(..., description="Full transcript or text to summarize", min_length=1)
    instructions: Optional[str] = Field(None, description="Optional custom guidance for the model")
    focus: Optional[str] = Field(None, description="Key topics or outcomes to prioritize")
    format: SummaryFormat = Field(SummaryFormat.PARAGRAPH, description="Preferred summary style")
    temperature: Optional[float] = Field(None, description="Override generation temperature")
    max_tokens: Optional[int] = Field(None, description="Override maximum tokens for the response")


class SummarizationResponse(BaseModel):
    """Response model for summarization."""
    summary: str = Field(..., description="Generated summary text")
    model: str = Field(..., description="Model used for generation")
    prompt_tokens: Optional[int] = Field(None, description="Approximate tokens used for the prompt")
    completion_tokens: Optional[int] = Field(None, description="Approximate tokens generated in the summary")
    duration_ms: Optional[float] = Field(None, description="Total time spent generating the summary in milliseconds")


class CallSegment(BaseModel):
    """Single utterance in a diarized transcript."""

    speaker: str = Field(..., description="Speaker label, e.g. 'Agent' or 'Customer'")
    text: str = Field(..., description="Original segment text")


class CallSummarizationRequest(BaseModel):
    """Request payload for structured call summaries."""

    transcript_text: str = Field(..., description="Full transcript of the conversation", min_length=1)
    client_name: Optional[str] = Field(None, description="Client name used in the report")
    status: Optional[str] = Field(None, description="Deal status or pipeline stage")
    action_items: List[str] = Field(default_factory=list, description="Known follow-up actions")
    decision: Optional[str] = Field(None, description="Decision captured during the call")
    segments: List[CallSegment] = Field(
        default_factory=list,
        description="Ordered transcript segments to derive discussion points",
    )


class CallSummaryDetails(BaseModel):
    """Aggregated themes extracted from the call."""

    category: str = Field(..., description="Deal or conversation category")
    purpose: str = Field(..., description="Call purpose in natural language")
    discussionPoints: List[str] = Field(..., description="Key talking points")
    actionItems: List[str] = Field(..., description="Action items detected or inferred")
    decisionMade: str = Field(..., description="Outcome or decision recorded during the call")
    createdAt: str = Field(..., description="Summary creation date in DD.MM.YYYY format")
    managerRecommendations: Optional[List[str]] = Field(
        None, description="Coach-style recommendations for the manager"
    )


class SentimentDetails(BaseModel):
    """Sentiment snapshot for the call."""

    overall: str = Field(..., description="Overall sentiment label")
    tone: List[str] = Field(..., description="Leading tonal characteristics")
    drivers: List[str] = Field(..., description="Factors that drove the sentiment")
    recommendations: List[str] = Field(..., description="Suggestions informed by sentiment analysis")
    managerRecommendations: Optional[List[str]] = Field(
        None, description="Additional manager-specific sentiment actions"
    )


class ScorecardEntry(BaseModel):
    """Single KPI card in the scoring dashboard."""

    title: str = Field(..., description="KPI name")
    score: float = Field(..., description="Achieved score value")
    target: float = Field(..., description="Target score for the KPI")
    description: str = Field(..., description="Explanation or rubric snippet")


class CallSummarizationResponse(BaseModel):
    """Structured scoring payload consumed by the frontend."""

    callSummary: CallSummaryDetails = Field(..., description="Key conversation outcomes")
    sentiment: SentimentDetails = Field(..., description="Sentiment analysis results")
    scorecards: List[ScorecardEntry] = Field(..., description="List of KPI scorecards")


class ChecklistCriterionInput(BaseModel):
    """Single criterion inside a checklist category supplied by the frontend."""

    id: str = Field(..., description="Unique identifier of the checklist criterion")
    text: str = Field(..., description="Criterion wording visible to supervisors")
    description: Optional[str] = Field(None, description="Extended context for the criterion")
    type: Optional[str] = Field(None, description="Criterion scoring type (binary, scale, etc.)")


class ChecklistCategoryInput(BaseModel):
    """Checklist category grouping multiple criteria."""

    id: str = Field(..., description="Unique identifier of the checklist category")
    name: str = Field(..., description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    criteria: List[ChecklistCriterionInput] = Field(..., description="Criteria contained in the category")


class ChecklistInput(BaseModel):
    """Minimal representation of a checklist required for scoring."""

    id: str = Field(..., description="Checklist identifier")
    name: str = Field(..., description="Checklist name")
    description: Optional[str] = Field(None, description="Checklist description")
    categories: List[ChecklistCategoryInput] = Field(..., description="Checklist categories")


class ChecklistAnalysisResult(BaseModel):
    """Result returned for a single checklist criterion."""

    criterion_id: str = Field(..., description="Criterion identifier")
    category_id: str = Field(..., description="Parent category identifier")
    score: Literal[0, 1, "?"] = Field(..., description="Automated verdict for the criterion")
    confidence: int = Field(..., description="Confidence score between 0 and 100")
    explanation: str = Field(..., description="Human-readable explanation for the verdict")
    needs_review: bool = Field(..., description="Whether a supervisor should review the item")


class ChecklistAnalysisResponse(BaseModel):
    """Payload returned from the automated scoring endpoint."""

    results: List[ChecklistAnalysisResult] = Field(..., description="List of evaluated criteria")


class ChecklistAnalysisRequest(BaseModel):
    """Request payload used when scoring a transcript against a checklist."""

    transcript_text: str = Field(..., description="Transcript text that should be evaluated", min_length=1)
    checklist: ChecklistInput = Field(..., description="Checklist definition")
    client_name: Optional[str] = Field(None, description="Client name for context")
    status: Optional[str] = Field(None, description="Pipeline or deal status")
    action_items: List[str] = Field(default_factory=list, description="Known action items for context")
    decision: Optional[str] = Field(None, description="Known decision or outcome")
    segments: List[CallSegment] = Field(
        default_factory=list,
        description="Ordered transcript segments used to enrich the call summary",
    )
