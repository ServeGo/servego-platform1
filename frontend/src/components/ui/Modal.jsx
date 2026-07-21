import { X } from 'lucide-react';

export function Modal({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl enterprise-slide-up max-h-[85vh] flex flex-col`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

export function Drawer({ title, children, onClose, side = 'right' }) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className={`fixed top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-full max-w-lg bg-white shadow-2xl z-50 enterprise-slide-up overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="enterprise-btn-secondary text-xs">Cancel</button>
        <button onClick={onConfirm} className={`${danger ? 'enterprise-btn-danger' : 'enterprise-btn-primary'} text-xs`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
