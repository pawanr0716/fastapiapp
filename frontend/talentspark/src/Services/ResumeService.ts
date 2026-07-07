import api from "./api";
import type { ResumeRequest, ResumeResponse } from "../types/resume";

export async function analyseResume(request: ResumeRequest): Promise<ResumeResponse> {
  const response = await api.post<ResumeResponse>("/rag/analyse-resume", request);
  return response.data;
}
