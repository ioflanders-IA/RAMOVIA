import React, { useRef, useState } from 'react';
import { WorkReport } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  Download,
  CheckCircle,
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Package,
  Camera,
  FileCheck2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface WorkReportModalProps {
  report: WorkReport;
  onClose: () => void;
}

export const WorkReportModal: React.FC<WorkReportModalProps> = ({ report, onClose }) => {
  const { currentUser, approveWorkReport } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [adminNotesInput, setAdminNotesInput] = useState(report.adminNotes || '');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Rapportino_RAMOVIA_${report.clientName.replace(/\s+/g, '_')}_${report.date}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF', err);
      // Fallback: trigger print
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleApprove = () => {
    approveWorkReport(report.id, adminNotesInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide">
              Rapportino di Lavoro Digitale <span className="font-mono text-emerald-300">#{report.id.slice(-6)}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE / EXPORTABLE RAPPORTINO BODY */}
        <div ref={printAreaRef} className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          
          {/* Company Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center text-emerald-400 font-extrabold text-2xl tracking-tighter shadow-sm">
                R
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-emerald-950">RAMOVIA</div>
                <div className="text-xs font-semibold text-emerald-700">Manutenzione del Verde & Giardini</div>
                <div className="text-[11px] text-slate-500">P.IVA 03984120961 · Sede Operativa: Monza & Brianza</div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600">
              <div className="text-sm font-bold text-slate-900">
                RAPPORTINO N. {report.id.slice(-6).toUpperCase()}
              </div>
              <div>Data intervento: <strong>{report.date}</strong></div>
              <div className="mt-1">
                Stato:{' '}
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  report.status === 'approved' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {report.status === 'approved' ? 'APPROVATO' : 'INVIATO DA OPERAIO'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Client & Worker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Committente / Cliente
              </div>
              <div className="text-sm font-bold text-slate-900">{report.clientName}</div>
              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{report.clientAddress}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Operatore Assegnato & Orari
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>{report.workerName}</span>
              </div>
              <div className="text-xs text-slate-600 font-mono flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{report.startTime} - {report.endTime}</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Totale: {report.totalHours} ore
                </span>
              </div>
            </div>
          </div>

          {/* Section: Job Description */}
          <div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrizione Intervento Eseguito
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 font-medium">
              <div className="font-bold text-slate-900 mb-1">{report.jobTitle}</div>
              {report.clientNotes || 'Manutenzione ordinaria del verde eseguita a regola d\'arte.'}
            </div>
          </div>

          {/* Section: Materials Used Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Materiali e Consumabili Utilizzati dal Furgone</span>
              </div>
            </div>

            {report.materialsUsed && report.materialsUsed.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Descrizione Articolo</th>
                      <th className="py-2 px-3 text-right">Quantità Scaricata</th>
                      <th className="py-2 px-3 text-right">Unità</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.materialsUsed.map((mat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">{mat.name}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                          {mat.qty}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">{mat.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic p-2 border border-dashed border-slate-200 rounded-lg">
                Nessun materiale consumabile scaricato per questo intervento (solo utilizzo attrezzi).
              </div>
            )}
          </div>

          {/* Section: Before / After Photographic Documentation */}
          <div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Rilievo Fotografico Certificato (Prima & Dopo)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prima */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="bg-rose-50 border-b border-rose-100 px-3 py-1.5 text-[11px] font-bold text-rose-800 flex items-center justify-between">
                  <span>STATO INIZIALE (PRIMA)</span>
                  <span className="text-slate-400 font-mono text-[10px]">Cantiere ore {report.startTime}</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-100">
                  {report.photosBefore && report.photosBefore.length > 0 ? (
                    <img
                      src={report.photosBefore[0]}
                      alt="Prima dell'intervento"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Nessuna foto iniziale</span>
                  )}
                </div>
              </div>

              {/* Dopo */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                  <span>STATO FINALE (DOPO)</span>
                  <span className="text-slate-400 font-mono text-[10px]">Cantiere completato</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-100">
                  {report.photosAfter && report.photosAfter.length > 0 ? (
                    <img
                      src={report.photosAfter[0]}
                      alt="Dopo l'intervento"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Nessuna foto finale</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Client Signature Box */}
          <div className="pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Note di Chiusura / Dichiarazioni
                </div>
                <div className="text-xs text-slate-600 italic">
                  I lavori sopra descritti sono stati visionati e accettati a regola d'arte dal committente o suo delegato.
                </div>
                {report.clientSigneeName && (
                  <div className="mt-2 text-xs text-slate-800">
                    Firmato da: <strong>{report.clientSigneeName}</strong>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Firma Digitale del Committente
                </div>
                <div className="w-full max-w-[280px] h-20 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center shadow-xs">
                  {report.signatureDataUrl ? (
                    <img
                      src={report.signatureDataUrl}
                      alt="Firma del cliente"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Firma non apposta</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Certificazione touch RAMOVIA · {report.date}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes View */}
          {report.adminNotes && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
              <span className="font-bold text-amber-900">Note Amministrazione: </span>
              {report.adminNotes}
            </div>
          )}
        </div>

        {/* ADMIN ACTION FOOTER (Only shown to Admin in submitted state, not printed) */}
        {currentUser.role === 'admin' && (
          <div className="no-print bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto flex-1">
              <input
                type="text"
                placeholder="Aggiungi nota amministrativa (es. fatturato, tariffa applicata)..."
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {report.status !== 'approved' && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approva Rapportino</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
