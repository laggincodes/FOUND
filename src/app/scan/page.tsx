'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { scanPantryImage, SAMPLE_PANTRY_IMAGES, PantrySampleImage } from '@/lib/scanner';
import {
  Camera,
  Upload,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: empty | imageSelected | processing | error
  const [stage, setStage] = useState<'empty' | 'imageSelected' | 'processing' | 'error'>('empty');
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
        setStage('error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result as string);
        setSelectedSampleId(null);
        setStage('imageSelected');
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle preset sample selection
  const handleSelectSample = (sample: PantrySampleImage) => {
    setSelectedImageSrc(sample.url);
    setSelectedSampleId(sample.id);
    setStage('imageSelected');
    setErrorMessage(null);
  };

  // Trigger processing
  const handleStartProcessing = async () => {
    if (!selectedImageSrc) return;

    setStage('processing');
    setErrorMessage(null);

    try {
      const response = await scanPantryImage(selectedImageSrc, selectedSampleId || undefined);

      if (response.success && response.items.length > 0) {
        // Persist detected candidates to sessionStorage for /scan/results review
        sessionStorage.setItem('detected_pantry_items_v1', JSON.stringify(response.items));
        router.push('/scan/results');
      } else {
        setStage('error');
        setErrorMessage(
          'Could not clearly recognize pantry items in this image. Please ensure good lighting and try again.'
        );
      }
    } catch (err) {
      setStage('error');
      setErrorMessage('A network error occurred while processing the image. Please retry.');
    }
  };

  const handleReset = () => {
    setStage('empty');
    setSelectedImageSrc(null);
    setSelectedSampleId(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Add Food', href: '/add' },
          { label: 'Scan Pantry' },
        ]}
      />

      {/* Header */}
      <div className="mt-4 mb-8">
        <Link
          href="/add"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8E968F] hover:text-[#EFF1EC] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to choices</span>
        </Link>
        <div className="text-[11px] font-mono tracking-widest text-[#8E968F] uppercase mb-1">
          Visual Intake
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#EFF1EC] tracking-tight">
          Scan Pantry or Fridge
        </h1>
        <p className="text-sm text-[#8E968F] mt-1">
          Upload a photo of your shelves. The scanner identifies recognizable ingredients for you to review and confirm.
        </p>
      </div>

      {/* Main Upload / Camera View Area */}
      <div className="bg-[#181C19] rounded-xs border border-[#28302A] p-6 sm:p-8 mb-8">
        {/* State 1: Empty */}
        {stage === 'empty' && (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#28302A] hover:border-[#3B6647] rounded-xs p-8 sm:p-12 text-center cursor-pointer transition-colors bg-[#141715] hover:bg-[#161A17] group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload pantry image"
            >
              <div className="w-14 h-14 rounded-xs bg-[#181C19] border border-[#28302A] text-[#86EFAC] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                <Camera className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h2 className="font-serif font-bold text-lg text-[#EFF1EC]">
                Take a photo or upload an image
              </h2>
              <p className="text-xs text-[#8E968F] mt-1 max-w-sm mx-auto">
                Select a photo of your refrigerator shelves, produce drawer, or dry cupboard storage.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xs bg-[#1E2420] border border-[#28302A] text-xs font-mono uppercase tracking-wider text-[#EFF1EC] shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-[#8E968F]" />
                <span>Choose Image File</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              aria-label="File input"
            />

            {/* Quick Testing Presets */}
            <div className="pt-4 border-t border-[#28302A]">
              <h3 className="text-[10px] font-mono font-bold text-[#8E968F] uppercase tracking-widest mb-3">
                Or test with a sample pantry photo:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_PANTRY_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="flex items-center gap-3 p-3 text-left rounded-xs border border-[#28302A] hover:border-[#3B6647] bg-[#141715] hover:bg-[#181C19] transition-all cursor-pointer group"
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-14 h-14 object-cover rounded-xs shrink-0 border border-[#28302A]"
                    />
                    <div>
                      <div className="text-xs font-serif font-bold text-[#EFF1EC] group-hover:text-[#86EFAC]">
                        {sample.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#8E968F] line-clamp-1 mt-0.5">
                        {sample.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State 2: Image Selected */}
        {stage === 'imageSelected' && selectedImageSrc && (
          <div className="space-y-6">
            <div className="relative rounded-xs overflow-hidden border border-[#28302A] max-h-80 bg-[#141715] flex items-center justify-center">
              <img
                src={selectedImageSrc}
                alt="Selected pantry preview"
                className="max-h-80 w-auto object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-mono text-[#8E968F] hover:text-[#EFF1EC] rounded-xs hover:bg-[#1E2420] border border-transparent hover:border-[#28302A] transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Choose a different photo</span>
              </button>

              <button
                onClick={handleStartProcessing}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider rounded-xs border border-[#4E805B]/30 shadow-xs transition-colors min-h-[44px]"
              >
                <span>Look for Food Items</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Processing */}
        {stage === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#28302A] border-t-[#86EFAC] animate-spin mx-auto"></div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#EFF1EC]">
                Looking for recognizable food items…
              </h3>
              <p className="text-xs text-[#8E968F] mt-1 max-w-sm mx-auto leading-relaxed">
                Analyzing photo for common pantry ingredients. You will be able to review and confirm all findings.
              </p>
            </div>
          </div>
        )}

        {/* State 4: Error State */}
        {stage === 'error' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xs bg-[#2D1915] text-[#F87171] border border-[#4D241D] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#EFF1EC]">Scan Not Completed</h3>
              <p className="text-xs text-[#8E968F] mt-1 max-w-md mx-auto leading-relaxed">
                {errorMessage || 'Unable to recognize food items in the provided photo.'}
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs min-h-[44px]"
              >
                Try Another Photo
              </button>
              <Link
                href="/add/manual"
                className="px-4 py-2.5 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider border border-[#28302A] rounded-xs min-h-[44px] inline-flex items-center"
              >
                Add Manually Instead
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Honest Capabilities Notice */}
      <div className="p-4 rounded-xs bg-[#181C19] border border-[#28302A] text-xs text-[#8E968F]">
        <strong className="text-[#EFF1EC] font-serif block mb-1">What the scanner does and does not do:</strong>
        <p className="leading-relaxed">
          The scanner identifies recognizable visible foods (e.g. spinach, tomatoes, milk, pasta).
          It <strong className="text-[#EFF1EC]">never</strong> pretends to know exact expiration dates, sealed/opened status, or food safety.
          You always review and complete missing details before items enter your pantry.
        </p>
      </div>
    </div>
  );
}
