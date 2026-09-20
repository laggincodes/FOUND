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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to choices</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Scan Pantry or Fridge
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Upload a photo of your shelves. The scanner identifies recognizable ingredients for you to review and confirm.
        </p>
      </div>

      {/* Main Upload / Camera View Area */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 sm:p-8 shadow-soft mb-8">
        {/* State 1: Empty */}
        {stage === 'empty' && (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#DDD2BC] hover:border-[#C84B31] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-earth-50/50 hover:bg-earth-50 group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload pantry image"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-surface-border text-[#C84B31] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                <Camera className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h2 className="font-serif font-bold text-lg text-ink">
                Take a photo or upload an image
              </h2>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Select a photo of your refrigerator shelves, produce drawer, or dry cupboard storage.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-surface-border text-xs font-semibold text-ink shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-ink-muted" />
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
            <div className="pt-4 border-t border-earth-100">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                Or test with a sample pantry photo:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_PANTRY_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="flex items-center gap-3 p-3 text-left rounded-xl border border-surface-border hover:border-[#C84B31] bg-earth-50/70 hover:bg-white transition-all cursor-pointer group"
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-14 h-14 object-cover rounded-lg shrink-0 border border-surface-border"
                    />
                    <div>
                      <div className="text-xs font-bold text-ink group-hover:text-[#C84B31]">
                        {sample.name}
                      </div>
                      <div className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
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
            <div className="relative rounded-xl overflow-hidden border border-surface-border max-h-80 bg-earth-100 flex items-center justify-center">
              <img
                src={selectedImageSrc}
                alt="Selected pantry preview"
                className="max-h-80 w-auto object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-ink-muted hover:text-ink font-medium rounded-xl hover:bg-earth-100 transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Choose a different photo</span>
              </button>

              <button
                onClick={handleStartProcessing}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#C84B31] hover:bg-[#b03e26] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors min-h-[44px]"
              >
                <span>Look for Food Items</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Processing (Honest, no fake AI science animations) */}
        {stage === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-earth-200 border-t-[#C84B31] animate-spin mx-auto"></div>
            <div>
              <h3 className="font-serif font-bold text-xl text-ink">
                Looking for recognizable food items…
              </h3>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Analyzing photo for common pantry ingredients. You will be able to review and confirm all findings.
              </p>
            </div>
          </div>
        )}

        {/* State 4: Error State */}
        {stage === 'error' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-ink">Scan Not Completed</h3>
              <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto leading-relaxed">
                {errorMessage || 'Unable to recognize food items in the provided photo.'}
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-[#C84B31] hover:bg-[#b03e26] text-white text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Try Another Photo
              </button>
              <Link
                href="/add/manual"
                className="px-4 py-2.5 bg-earth-100 hover:bg-earth-200 text-ink text-xs font-medium rounded-xl min-h-[44px] inline-flex items-center"
              >
                Add Manually Instead
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Honest Capabilities Notice */}
      <div className="p-4 rounded-xl bg-earth-50 border border-surface-border text-xs text-ink-muted">
        <strong className="text-ink font-semibold block mb-1">What the scanner does and does not do:</strong>
        <p className="leading-relaxed">
          The scanner identifies recognizable visible foods (e.g. spinach, tomatoes, milk, pasta).
          It <strong>never</strong> pretends to know exact expiration dates, sealed/opened status, or food safety.
          You always review and complete missing details before items enter your pantry.
        </p>
      </div>
    </div>
  );
}
