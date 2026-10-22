import React, { useRef, useState } from 'react';
import { WorkReport } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  Download,
  CheckCircle,
  X,
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

      const fileName = `Rapportino_${report.clientName.replace(/\s+/g, '_')}_${report.date}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleApprove = () => {
    approveWorkReport(report.id, adminNotesInput);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-[7px] shadow-2xl border border-slate-200 overflow-hidden my-2 space-y-[7px]">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white p-[7px] px-3 flex items-center justify-between gap-[7px]">
          <div className="flex items-center gap-[7px]">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide">
              Rapportino di Lavoro <span className="font-mono text-emerald-300">#{report.id.slice(-6)}</span>
            </h2>
          </div>

          <div className="flex items-center gap-[7px]">
            <button
              onClick={handlePrint}
              className="flex items-center gap-[7px] px-3 py-1.5 rounded-[7px] bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-[7px] px-3 py-1.5 rounded-[7px] bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE / EXPORTABLE RAPPORTINO BODY */}
        <div ref={printAreaRef} className="p-[7px] sm:p-5 bg-white text-slate-900 space-y-[7px]">
          
          {/* Company Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px] border-b border-slate-200 pb-[7px]">
            <div className="flex items-center gap-[7px]">
              <div className="w-10 h-10 rounded-[7px] bg-emerald-950 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/RAMOVIA_Logo.svg" alt="RAMOVIA" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-emerald-950">RAMOVIA</div>
                <div className="text-[11px] font-semibold text-emerald-700">Gestionale Operativo Manutenzione del Verde</div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600">
              <div className="text-sm font-bold text-slate-900">
                RAPPORTINO N. {report.id.slice(-6).toUpperCase()}
              </div>
              <div>Data intervento: <strong>{report.date}</strong></div>
              <div className="mt-0.5">
                Stato:{' '}
                <span className={`inline-block px-2 py-0.5 rounded-[7px] text-[10px] font-bold ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px] bg-slate-50 border border-slate-200 rounded-[7px] p-[7px]">
            <div className="space-y-[7px]">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Committente / Cliente
              </div>
              <div className="text-sm font-bold text-slate-900">{report.clientName}</div>
              <div className="text-xs text-slate-600 flex items-center gap-[7px]">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{report.clientAddress}</span>
              </div>
            </div>

            <div className="space-y-[7px]">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Operatore Assegnato & Orari
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-[7px]">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>{report.workerName}</span>
              </div>
              <div className="text-xs text-slate-600 font-mono flex items-center gap-[7px] flex-wrap">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{report.startTime} - {report.endTime}</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-[7px]">
                  Totale: {report.totalHours} ore
                </span>
              </div>
            </div>
          </div>

          {/* Section: Job Description */}
          <div className="space-y-[7px]">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Descrizione Intervento Eseguito
            </div>
            <div className="p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs leading-relaxed text-slate-800 font-medium space-y-[7px]">
              <div className="font-bold text-slate-900">{report.jobTitle}</div>
              <p>{report.clientNotes || 'Manutenzione ordinaria del verde eseguita.'}</p>
            </div>
          </div>

          {/* Section: Materials Used Table */}
          <div className="space-y-[7px]">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-[7px]">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Materiali Utilizzati dal Magazzino</span>
            </div>

            {report.materialsUsed && report.materialsUsed.length > 0 ? (
              <div className="border border-slate-200 rounded-[7px] overflow-hidden">
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
              <div className="text-xs text-slate-400 italic p-[7px] border border-dashed border-slate-200 rounded-[7px]">
                Nessun materiale consumabile scaricato per questo intervento.
              </div>
            )}
          </div>

          {/* Section: Before / After Photographic Documentation */}
          <div className="space-y-[7px]">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-[7px]">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Rilievo Fotografico (Prima & Dopo)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              {/* Prima */}
              <div className="border border-slate-200 rounded-[7px] overflow-hidden bg-slate-50">
                <div className="bg-rose-50 border-b border-rose-100 px-3 py-1 text-[11px] font-bold text-rose-800 flex items-center justify-between">
                  <span>STATO INIZIALE (PRIMA)</span>
                  <span className="text-slate-400 font-mono text-[10px]">Ore {report.startTime}</span>
                </div>
                <div className="p-1 aspect-video flex items-center justify-center bg-slate-100">
                  {report.photosBefore && report.photosBefore.length > 0 ? (
                    <img
                      src={report.photosBefore[0]}
                      alt="Prima dell'intervento"
                      className="w-full h-full object-cover rounded-[7px]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Nessuna foto iniziale</span>
                  )}
                </div>
              </div>

              {/* Dopo */}
              <div className="border border-slate-200 rounded-[7px] overflow-hidden bg-slate-50">
                <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                  <span>STATO FINALE (DOPO)</span>
                  <span className="text-slate-400 font-mono text-[10px]">Ore {report.endTime}</span>
                </div>
                <div className="p-1 aspect-video flex items-center justify-center bg-slate-100">
                  {report.photosAfter && report.photosAfter.length > 0 ? (
                    <img
                      src={report.photosAfter[0]}
                      alt="Dopo l'intervento"
                      className="w-full h-full object-cover rounded-[7px]"
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
          <div className="pt-[7px] border-t border-slate-200 space-y-[7px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px] items-end">
              <div className="space-y-[7px]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Note di Chiusura
                </div>
                <div className="text-xs text-slate-600 italic">
                  I lavori sopra descritti sono stati visionati e accettati dal committente o suo delegato.
                </div>
                {report.clientSigneeName && (
                  <div className="text-xs text-slate-800">
                    Firmato da: <strong>{report.clientSigneeName}</strong>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end space-y-[7px]">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Firma Digitale del Committente
                </div>
                <div className="w-full max-w-[280px] h-20 border border-slate-300 rounded-[7px] p-1 bg-white flex items-center justify-center shadow-xs">
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
                <div className="text-[10px] text-slate-400 font-mono">
                  {report.date}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes View */}
          {report.adminNotes && (
            <div className="bg-slate-50 border border-slate-200 rounded-[7px] p-[7px] text-xs text-slate-700">
              <span className="font-bold text-slate-900">Note Amministrazione: </span>
              {report.adminNotes}
            </div>
          )}
        </div>

        {/* ADMIN ACTION FOOTER */}
        {currentUser?.role === 'admin' && (
          <div className="no-print bg-slate-50 border-t border-slate-200 p-[7px] flex flex-col sm:flex-row items-center justify-between gap-[7px]">
            <div className="w-full sm:w-auto flex-1">
              <input
                type="text"
                placeholder="Aggiungi annotazione amministrativa..."
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                className="w-full text-xs p-[7px] bg-white border border-slate-300 rounded-[7px] focus:outline-emerald-600"
              />
            </div>

            <div className="flex items-center gap-[7px] w-full sm:w-auto justify-end">
              {report.status !== 'approved' && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-[7px] px-4 py-1.5 rounded-[7px] bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approva Rapportino</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-[7px] bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors"
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
