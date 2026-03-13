import React, { useState, useMemo } from 'react';
import styles from '../styles/Table.module.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  filterable?: boolean;
  sortable?: boolean;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  className?: string;
  condition?: (item: T) => boolean;
  tooltip?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: TableAction<T>[];
  noDataMessage?: string;
  keyExtractor: (item: T) => string | number;
  itemsPerPage?: number;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  actions,
  noDataMessage = 'No se encontraron registros',
  keyExtractor,
  itemsPerPage = 10,
}: TableProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrar y ordenar datos
  const filteredData = useMemo(() => {
    let result = data.filter((item) => {
      return Object.keys(filters).every((key) => {
        const filterValue = filters[key].toLowerCase();
        if (!filterValue) return true;
        
        const column = columns.find(col => col.key === key);
        let itemValue = '';
        
        if (column?.render) {
          // Para columnas con render personalizado, intentar obtener el valor del item
          itemValue = String(item[key] || '').toLowerCase();
        } else {
          itemValue = String(item[key] || '').toLowerCase();
        }
        
        return itemValue.includes(filterValue);
      });
    });

    // Aplicar ordenamiento
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, columns, sortKey, sortDirection]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Actualizar filtro
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1); // Resetear a la primera página al filtrar
  };

  // Manejar ordenamiento
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Generar botones de paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Botón anterior
    pages.push(
      <button
        key="prev"
        className={styles.paginationBtn}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>
    );

    // Primera página
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className={styles.paginationBtn}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className={styles.ellipsis}>...</span>);
      }
    }

    // Páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`${styles.paginationBtn} ${i === currentPage ? styles.active : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Última página
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className={styles.ellipsis}>...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          className={styles.paginationBtn}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Botón siguiente
    pages.push(
      <button
        key="next"
        className={styles.paginationBtn}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    );

    return pages;
  };

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  <div className={styles.headerCell}>
                    <div 
                      className={col.sortable !== false ? styles.sortableHeader : ''}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className={styles.sortIcon}>
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? ' ▲' : ' ▼'
                          ) : ' △'}
                        </span>
                      )}
                    </div>
                    {col.filterable !== false && (
                      <input
                        type="text"
                        className={styles.filterInput}
                        placeholder="Filtrar..."
                        value={filters[col.key] || ''}
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th>
                  <div className={styles.headerCell}>
                    <span>Acciones</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr key={keyExtractor(item)}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className={styles.actions}>
                      {actions.map((action, idx) => {
                        // Si hay condición, evaluar si se debe mostrar el botón
                        if (action.condition && !action.condition(item)) {
                          return null;
                        }
                        return (
                          <button
                            key={idx}
                            className={action.className || styles.btnAction}
                            onClick={() => action.onClick(item)}
                            title={action.tooltip}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className={styles.noData}>
                  {noDataMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {filteredData.length > 0 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className={styles.pagination}>
            {renderPagination()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
