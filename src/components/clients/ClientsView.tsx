import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { ClientModal } from './ClientModal';
import {
  Users,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  ShieldAlert,
  Edit2,
  Trash2,
  Sprout,
  Droplets,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const { clients, jobs, reports, addClient, updateClient, deleteClient, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = (clientData: any) => {
    if (selectedClientForEdit) {
      updateClient({ ...selectedClientForEdit, ...clientData });
      setSelectedClientForEdit(null);
    } else {
      addClient(clientData);
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="space-y-[7px]">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-[7px]">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>Anagrafica Clienti & Schede Giardino</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dettagli tecnici cantieri, superfici a verde, impianti di irrigazione e storico interventi.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center gap-[7px] p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-[7px] shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Cliente / Cantiere</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {clients.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca cliente per nome o indirizzo..."
            className="w-full pl-9 pr-4 p-[7px] text-xs bg-white border border-slate-200 rounded-[7px] shadow-xs focus:outline-emerald-600"
          />
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] py-12 text-center text-slate-500 text-xs space-y-[7px]">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-700">Nessun cliente o cantiere registrato</p>
          <p className="text-slate-500">Aggiungi il tuo primo cliente per iniziare a gestire i giardini e pianificare i lavori.</p>
          {currentUser?.role === 'admin' && (
            <div className="pt-2">
              <button
                onClick={() => setIsCreatingNew(true)}
                className="inline-flex items-center gap-[7px] p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold shadow-xs text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Crea Primo Cliente</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Clients Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
          {filteredClients.map((client) => {
            const clientJobs = jobs.filter((j) => j.clientId === client.id);
            const completedJobs = clientJobs.filter((j) => j.status === 'completed');
            const clientReports = reports.filter((r) => r.clientId === client.id);

            return (
              <div
                key={client.id}
                className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-[7px]"
              >
                <div className="space-y-[7px]">
                  {/* Header card */}
                  <div className="flex items-start justify-between gap-[7px]">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {client.name}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-[7px] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.address}</span>
                      </div>
                    </div>

                    {currentUser?.role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedClientForEdit(client)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Confermi di eliminare il cliente ${client.name}?`)) {
                              deleteClient(client.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact strip */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 font-mono">
                    <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-emerald-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </a>
                    {client.email && (
                      <span className="truncate flex items-center gap-1 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.email}</span>
                      </span>
                    )}
                  </div>

                  {/* Technical Garden Details Banner */}
                  <div className="mt-4 p-3 bg-emerald-950/5 border border-emerald-100 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
                        <Sprout className="w-4 h-4 text-emerald-700" />
                        Superficie Giardino
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {client.gardenNotes.squareMeters} mq
                      </span>
                    </div>

                    <div className="text-slate-700 flex items-start gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>{client.gardenNotes.irrigationDetails}</span>
                    </div>

                    {client.gardenNotes.delicatePlants && (
                      <div className="text-slate-600">
                        <strong className="text-slate-800">Essenze delicate: </strong>
                        {client.gardenNotes.delicatePlants}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-slate-600">
                        Codice cancello: <strong className="font-mono text-slate-900">{client.gardenNotes.gateCode}</strong>
                      </div>

                      {client.gardenNotes.dogPresent && (
                        <span className="flex items-center gap-1 text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-[11px] font-bold">
                          <ShieldAlert className="w-3 h-3 text-amber-700" />
                          Cane presente
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer card: Jobs history summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>
                      Interventi svolti: <strong className="font-mono text-slate-800">{completedJobs.length}</strong>
                    </span>
                    <span>
                      Rapportini: <strong className="font-mono text-slate-800">{clientReports.length}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Modal */}
      {(isCreatingNew || selectedClientForEdit) && (
        <ClientModal
          client={selectedClientForEdit}
          onClose={() => {
            setIsCreatingNew(false);
            setSelectedClientForEdit(null);
          }}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
};
