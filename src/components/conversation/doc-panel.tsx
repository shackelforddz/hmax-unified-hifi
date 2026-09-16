"use client";

import { X, Download, Share2, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
}

const ALERTS = [
  {
    id: 1,
    text: "Gasket set: Out of stock. Purchase order must be raised today - not yet done.",
    action: "Raise PO",
  },
  {
    id: 2,
    text: "Site visit date not confirmed with customer - negotiate scheduling.",
    action: "Mark as read",
  },
];

const CASE_FIELDS = [
  { label: "Case ID", value: "1345-7861" },
  { label: "Customer", value: "Xcel Energy" },
  { label: "Contract value", value: "€4.2M" },
  { label: "COTD", value: "9 Nov 2023" },
  { label: "Due date", value: "17 Nov 2023" },
  { label: "Stage", value: "Inspection - Diagnostic Testing" },
];

const STAFF = [
  { name: "Sara S.", role: "Field Engineer", img: "/avatars/5.jpg" },
  { name: "Jim D.", role: "Senior Field Engineer", img: "/avatars/33.jpg" },
  { name: "Liam G.", role: "Field Engineer", img: "/avatars/13.jpg" },
];

const PARTS = [
  { name: "HVAC kit", qty: "1", status: "In stock" },
  { name: "Insulating oil", qty: "200L", status: "In stock" },
  { name: "Transformer gasket set", qty: "1", status: "PO pending" },
  { name: "HV cable termination", qty: "6", status: "In stock" },
  { name: "Nitrogen coolant", qty: "50kg", status: "In stock" },
];

export default function DocPanel({ onClose }: Props) {
  return (
    <div className="w-[460px] h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-base text-gray-900">Xcel Energy Mobilization</h2>
          <p className="text-xs text-gray-400 mt-0.5">Generated plan · Aug 2024</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors cursor-pointer">
            <Download size={14} />
          </button>
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors cursor-pointer">
            <Share2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6 no-scrollbar">

        {/* Alerts */}
        <div className="flex flex-col gap-2">
          {ALERTS.map((alert) => (
            <div key={alert.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={15} className="text-gray-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">{alert.text}</p>
                <button className="mt-2 flex items-center gap-1 text-xs text-gray-800 font-medium hover:text-gray-900 transition-colors cursor-pointer">
                  {alert.action} <ChevronRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Case Details */}
        <div>
          <p className="text-xs text-gray-400 tracking-wider mb-3">Case Details</p>
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            {CASE_FIELDS.map(({ label, value }, i) => (
              <div key={label} className={`flex items-start gap-4 px-4 py-2.5 ${i < CASE_FIELDS.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Staffing */}
        <div>
          <p className="text-xs text-gray-400 tracking-wider mb-3">Staffing</p>
          <div className="flex flex-col gap-2">
            {STAFF.map((s) => (
              <div key={s.name} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt={s.name}
                  className="w-8 h-8 rounded-full object-cover bg-gray-200 shrink-0"
                />
                <div>
                  <p className="text-sm text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parts */}
        <div>
          <p className="text-xs text-gray-400 tracking-wider mb-3">Parts & Materials</p>
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 border-b border-gray-200">
              <span className="text-xs text-gray-400">Part</span>
              <span className="text-xs text-gray-400 text-right">Qty</span>
              <span className="text-xs text-gray-400 text-right">Status</span>
            </div>
            {PARTS.map((p, i) => (
              <div key={p.name} className={`grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 items-center ${i < PARTS.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-sm text-gray-700">{p.name}</span>
                <span className="text-xs text-gray-500 text-right">{p.qty}</span>
                <span className={`text-xs text-right whitespace-nowrap ${p.status === "PO pending" ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <p className="text-xs text-gray-400 tracking-wider mb-3">Schedule</p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-sm text-gray-700">5 – 16 August 2024</p>
            <p className="text-xs text-gray-400 mt-1">10 working days · Central US</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pb-2">
          <Button className="flex-1 gap-2 rounded-full h-auto py-2.5 text-sm cursor-pointer">
            <Download size={14} /> Download
          </Button>
          <Button variant="outline" className="flex-1 gap-2 rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer">
            <Share2 size={14} /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}
