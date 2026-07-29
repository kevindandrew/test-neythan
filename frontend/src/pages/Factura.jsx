import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Printer, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { Skeleton } from '../components/Skeleton';

function Fila({ label, valor }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="font-medium text-slate-700">{label}:</span>
      <span className="text-slate-600 text-right">{valor}</span>
    </div>
  );
}

export default function Factura() {
  const { idPedido } = useParams();
  const [factura, setFactura] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarFactura() {
      setCargando(true);
      setError('');
      try {
        const data = await api.get(`/api/factura/${idPedido}`);
        if (activo) setFactura(data);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudo cargar la factura.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarFactura();
    return () => {
      activo = false;
    };
  }, [idPedido]);

  const fecha = factura?.fecha ? new Date(factura.fecha).toLocaleString() : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-red-600 text-white px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-150 items-center gap-2">
          <Package size={18} strokeWidth={2} />
          <span className="font-semibold text-sm">Chaski Delivery - Factura</span>
        </div>
      </nav>

      <div className="mx-auto my-6 w-full max-w-150 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {cargando && (
            <div className="p-8 space-y-4">
              <div className="text-center space-y-2 mb-2">
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-3 w-1/3 mx-auto" />
              </div>
              <div className="space-y-2 py-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}

          {!cargando && error && (
            <div className="text-center text-red-600 py-16 px-6">{error}</div>
          )}

          {!cargando && !error && factura && (
            <div className="p-8">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800 mb-0">Chaski Delivery</h3>
                <p className="text-slate-500 text-sm">Factura Electrónica</p>
              </div>
              <hr className="border-slate-200" />
              <div className="py-3">
                <Fila label="N° Factura" valor={factura.id_factura} />
                <Fila label="NIT" valor={factura.nit} />
                <Fila label="N° Autorización" valor={factura.nro_autorizacion} />
                <Fila label="Fecha de Emisión" valor={fecha} />
                <Fila label="Tipo de Pago" valor={factura.tipo_pago} />
              </div>
              <hr className="border-slate-200" />
              <div className="py-3">
                <Fila label="Cliente" valor={factura.cliente} />
                <Fila label="Correo" valor={factura.correo} />
                <Fila label="Dirección" valor={factura.direccion || 'N/A'} />
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between items-center pt-3">
                <h5 className="text-lg font-semibold text-slate-800">Total:</h5>
                <h5 className="text-lg font-semibold text-slate-800">
                  Bs. {parseFloat(factura.total).toFixed(2)}
                </h5>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 font-medium px-4 py-2 text-sm transition"
          >
            <Printer size={16} />
            Imprimir / Guardar PDF
          </button>
          <Link
            to="/cliente/panel"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium px-4 py-2 text-sm transition"
          >
            <ArrowLeft size={16} />
            Volver a mi panel
          </Link>
        </div>
      </div>
    </div>
  );
}
