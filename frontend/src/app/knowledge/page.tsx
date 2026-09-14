"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Search, Upload, FileText, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function KnowledgePage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("runbook");
  const [newContent, setNewContent] = useState("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const loadDocs = async () => {
    try {
      const data = await api.getKnowledge();
      setDocs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.searchKnowledge(searchQuery);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await api.uploadKnowledge(newTitle, newContent, newCategory);
      setUploadMsg(`Successfully ingested and vector-indexed '${newTitle}'`);
      setNewTitle("");
      setNewContent("");
      setShowUpload(false);
      loadDocs();
      setTimeout(() => setUploadMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            RAG Knowledge Base & Operational Runbooks
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Vector-indexed repository of SRE runbooks, historical postmortems, and architectural guides
          </p>
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition-all shadow-glow-cyan"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{showUpload ? "Cancel Ingestion" : "Ingest Document"}</span>
        </button>
      </div>

      {uploadMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{uploadMsg}</span>
        </div>
      )}

      {/* Upload Drawer */}
      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="cyber-card p-5 border-cyan-500/40 space-y-3 animate-fade-in"
        >
          <h3 className="text-sm font-mono font-bold text-white mb-2">
            Ingest Document into Semantic Vector Store
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Redis Eviction & Cache Thrash Mitigation Runbook"
                className="w-full px-3 py-2 rounded bg-[#0b101c] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101c] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="runbook">Runbook</option>
                <option value="postmortem">Incident Postmortem</option>
                <option value="architecture">Architecture Guide</option>
                <option value="security">Security Protocol</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Markdown Content
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
              placeholder="Paste runbook text, symptoms, and mitigation commands..."
              className="w-full px-3 py-2 rounded bg-[#0b101c] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold"
          >
            Chunk & Vector Index Document
          </button>
        </form>
      )}

      {/* Semantic Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runbooks via vector similarity (e.g., 'connection pool timeout mitigation')..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0e1422] border border-[#1e293b] focus:border-cyan-500 text-xs font-mono text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-[#0e1422] border border-[#1e293b] hover:border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold"
        >
          {isSearching ? "Searching..." : "Vector Search"}
        </button>
      </form>

      {/* Search Results if active */}
      {searchResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Vector Match Results ({searchResults.length} found)</span>
            <button
              onClick={() => setSearchResults(null)}
              className="text-cyan-400 hover:underline"
            >
              Clear Search
            </button>
          </div>
          {searchResults.map((r, i) => (
            <div key={i} className="cyber-card p-4 space-y-2 border-cyan-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">
                  {r.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  Cosine Similarity: {Math.round(r.relevance_score * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {r.chunk_content}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block">
                Source: {r.source} • Category: {r.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Indexed Documents Library */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Indexed Documents ({docs.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((d) => (
            <div key={d.id} className="cyber-card p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {d.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: DOC-{d.id}
                  </span>
                </div>
                <h3 className="text-sm font-mono font-bold text-white">
                  {d.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans line-clamp-3 mt-1.5 leading-relaxed">
                  {d.content.slice(0, 240)}...
                </p>
              </div>

              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-[#1e293b]">
                Source: {d.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
