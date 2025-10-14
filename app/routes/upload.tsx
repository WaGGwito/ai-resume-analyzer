import React, { type FormEvent } from 'react';
import {useState} from "react";
import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/format';
import { prepareInstructions, AIResponseFormat } from '../../constants';

const Upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: {
    companyName: string,
    jobTitle: string,
    jobDescription: string,
    file: File
  }) => {
setIsProcessing(true);
setStatusText('Uploading the file...');

const uploadedFile = await fs.upload([file]);
const resumePath = (uploadedFile as any)?.path as string | undefined;
if(!resumePath) { setStatusText('Error: Failed to upload file (no path)'); setIsProcessing(false); return; }

setStatusText('Converting to image...');
// Ensure only PDFs go through the PDF conversion pipeline
if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
  setStatusText('Error: Please upload a PDF file');
  setIsProcessing(false);
  return;
}
const imageFile =  await convertPdfToImage(file);
if(!imageFile.file) { setStatusText(`Error: Failed to convert PDF to image${imageFile.error ? ` - ${imageFile.error}` : ''}`); setIsProcessing(false); return; }

setStatusText('Uploading the image...');
const uploadedImage = await fs.upload([imageFile.file]);
const imagePath = (uploadedImage as any)?.path as string | undefined;
if(!imagePath) { setStatusText('Error: Failed to upload image (no path)'); setIsProcessing(false); return; }

setStatusText('Preparing data...');

const uuid = generateUUID();
const data: any = {
  resumePath,
  imagePath,
  companyName, jobTitle, jobDescription,
  feedback: '',
}
await kv.set(`resume:${uuid}`, JSON.stringify(data));
setStatusText('Analyzing resume...');
try {
  const feedback = await ai.feedback(
    imagePath,
    prepareInstructions({ AIResponseFormat: AIResponseFormat, jobTitle, jobDescription })
  );
  if (!feedback) {
    setStatusText('Error: Failed to analyze resume');
    setIsProcessing(false);
    return;
  }

  // Normalize various AI response shapes
  const msg = (Array.isArray((feedback as any)) ? (feedback as any)[0]?.message : (feedback as any)?.message) || (feedback as any);
  let content: any = (msg as any)?.content ?? (feedback as any)?.content ?? (feedback as any)?.choices ?? undefined;
  let feedbackText: string | undefined;

  // If OpenAI-like shape: { choices: [{ message: { content: '...' } }] }
  if (!content && (feedback as any)?.choices?.[0]?.message?.content) {
    content = (feedback as any).choices[0].message.content;
  }

  if (typeof content === 'string') {
    feedbackText = content;
  } else if (Array.isArray(content)) {
    // Try common shapes: { type: 'output_text', text: string } or { text: { content: string } } or { text: string }
    const pieces: string[] = [];
    for (const part of content) {
      if (typeof part?.text === 'string') pieces.push(part.text);
      else if (typeof part?.text?.content === 'string') pieces.push(part.text.content);
      else if (typeof part?.content === 'string') pieces.push(part.content);
      else if (typeof part === 'string') pieces.push(part);
    }
    if (pieces.length) feedbackText = pieces.join('\n');
  } else if (typeof msg === 'string') {
    feedbackText = msg;
  }
  if (!feedbackText) {
    console.debug('AI unexpected shape:', feedback);
    setStatusText('Error: Unexpected AI response format');
    setIsProcessing(false);
    return;
  }

  // Extract JSON if the model added any prose; find the first {...} block
  let jsonText = feedbackText;
  const firstBrace = feedbackText.indexOf('{');
  const lastBrace = feedbackText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = feedbackText.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.debug('AI feedback raw:', feedback);
    console.debug('AI feedbackText:', feedbackText);
    console.debug('AI jsonText attempted:', jsonText);
    setStatusText('Error: Could not parse AI response');
    setIsProcessing(false);
    return;
  }

  try {
    data.feedback = parsed;
    const kvOk = await kv.set(`resume:${uuid}`, JSON.stringify(data));
    if (!kvOk) {
      setStatusText('Error: Failed to save analysis to storage');
      setIsProcessing(false);
      return;
    }
  } catch (e) {
    const msg = e instanceof Error ? ` - ${e.message}` : '';
    setStatusText(`Error: Saving analysis failed${msg}`);
    setIsProcessing(false);
    return;
  }

  setStatusText('Analyzed successfully! redirecting...');
  // Give the UI a moment to render the success message before navigating
  await new Promise((resolve) => setTimeout(resolve, 800));
  try {
    navigate(`/resume/${uuid}`);
  } catch (e) {
    const msg = e instanceof Error ? ` - ${e.message}` : '';
    setStatusText(`Error: Redirect failed${msg}`);
    setIsProcessing(false);
  }
} catch (err) {
  const msg = err instanceof Error ? ` - ${err.message}` : '';
  console.error('Analyze error:', err);
  setStatusText(`Error: Resume analysis failed${msg}`);
  setIsProcessing(false);
}

  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = String(formData.get('company-name') ?? '');
    const jobTitle = String(formData.get('job-title') ?? '');
    const jobDescription = String(formData.get('job-description') ?? '');

    if (!file) return;
    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />

        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Smart feedback for your dream job</h1>
            {isProcessing ? (
              <>
                <h2>{statusText}</h2>
                <img src="/images/resume-scan.gif" alt="Scanning resume animation" className="w-full" />
              </>
            ) : (
              <h2>Drop your resume for an ATS score and improvement tips</h2>
            )}
            {!isProcessing && (
              <form
                id="upload-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 mt-8"
              >
                <div className="form-div">
                  <label htmlFor="company-name">Company Name</label>
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    placeholder="Enter Company Name"
                  />
                </div>

                <div className="form-div">
                  <label htmlFor="job-title">Job Title</label>
                  <input
                    type="text"
                    name="job-title"
                    id="job-title"
                    placeholder="Enter job Title"
                  />
                </div>

                <div className="form-div">
                  <label htmlFor="job-description">Job Description</label>
                  <textarea
                    rows={5}
                    name="job-description"
                    id="job-description"
                    placeholder="Enter job Description"
                  />
                </div>

                <div className="form-div">
                  <p>Upload Resume</p>
                  <FileUploader onFileSelect={handleFileSelect} selectedFile={file} />
                </div>

                <button className="primary-button" type="submit">
                  Analyze Resume
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    );
};

export default Upload;