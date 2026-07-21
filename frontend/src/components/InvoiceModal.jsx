import React from 'react';
import { Download, X, FileText } from 'lucide-react';

export default function InvoiceModal({ booking, onClose }) {
  const subtotal = booking.estimatedCost || 0;
  const platformFee = 0;
  const total = subtotal + platformFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 enterprise-backdrop" onClick={onClose} />
      <div className="bg-white rounded-xl border border-slate-100 p-6 max-w-lg w-full relative shadow-2xl enterprise-scale-in z-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border border-sky-100">
                Invoice
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Receipt #{booking.id}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="border border-slate-100 rounded-xl p-5 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-base font-bold text-sky-600">ServeGo Inc.</h4>
              <span className="text-[10px] text-slate-400 font-medium block uppercase">Hyderabad Operations</span>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Date</span>
              <span className="text-slate-900 font-bold">{booking.bookingDateLabel || booking.bookingDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium bg-slate-50 p-4 rounded-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer</span>
              <span className="text-slate-800 font-bold block">{booking.customerName}</span>
              <span className="text-slate-500 font-normal leading-relaxed block mt-0.5">{booking.locationAddress}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Provider</span>
              <span className="text-slate-800 font-bold block">{booking.providerName}</span>
              <span className="text-slate-500 font-normal block mt-0.5">Category: {booking.serviceCategory}</span>
            </div>
          </div>

          <table className="w-full text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                <th className="py-2 text-left font-bold">Description</th>
                <th className="py-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td className="py-2.5">
                  <span className="font-bold text-slate-800 block">{booking.serviceCategory}</span>
                  <span className="text-[10px] text-slate-500">{booking.bookingTimeSlot}</span>
                </td>
                <td className="py-2.5 text-right font-bold text-slate-800">₹{subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-500">Platform Fee</td>
                <td className="py-2.5 text-right font-bold text-slate-800">₹{platformFee}</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <div className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-100 text-[10px]">
              Service Completed
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase block">Total</span>
              <span className="text-lg font-bold text-slate-900 block leading-none">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={() => window.print()} className="enterprise-btn-primary flex-1">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button onClick={onClose} className="enterprise-btn-secondary px-6">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
