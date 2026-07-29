import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

function leerCarritoGuardado() {
  try {
    const raw = localStorage.getItem('carrito');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(leerCarritoGuardado);

  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(items));
  }, [items]);

  function agregarProducto(producto) {
    setItems((prev) => {
      const existente = prev.find((i) => i.id_producto === producto.id_producto);
      if (existente) {
        return prev.map((i) =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) }
            : i
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  }

  function incrementar(idProducto) {
    setItems((prev) =>
      prev.map((i) =>
        i.id_producto === idProducto ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) } : i
      )
    );
  }

  function decrementar(idProducto) {
    setItems((prev) =>
      prev.map((i) =>
        i.id_producto === idProducto ? { ...i, cantidad: Math.max(1, i.cantidad - 1) } : i
      )
    );
  }

  function quitarProducto(idProducto) {
    setItems((prev) => prev.filter((i) => i.id_producto !== idProducto));
  }

  function vaciarCarrito() {
    setItems([]);
  }

  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);
  const totalCarrito = items.reduce((acc, i) => acc + parseFloat(i.precio) * i.cantidad, 0);

  const grupos = Object.values(
    items.reduce((acc, i) => {
      if (!acc[i.id_sucursal]) {
        acc[i.id_sucursal] = {
          id_sucursal: i.id_sucursal,
          sucursal_nombre: i.sucursal_nombre,
          nombre_negocio: i.nombre_negocio,
          items: [],
        };
      }
      acc[i.id_sucursal].items.push(i);
      return acc;
    }, {})
  );

  return (
    <CartContext.Provider
      value={{
        items,
        grupos,
        cantidadTotal,
        totalCarrito,
        agregarProducto,
        incrementar,
        decrementar,
        quitarProducto,
        vaciarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}