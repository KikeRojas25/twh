import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ClienteService } from '../../_services/cliente.service';
import { SelectItem } from 'primeng/api';
import { GeneralService } from '../../_services/general.service';
import { TableModule } from 'primeng/table';
import { InventarioGeneral } from '../../_models/inventariogeneral';
import { ReportesService } from '../reportes.service';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { JwtHelperService } from '@auth0/angular-jwt';
import { PropietarioService } from '../../_services/propietario.service';
import * as FileSaver from 'file-saver';

/** Una condición del filtro avanzado (campo + operador + valor(es)). */
interface CondicionFiltro {
  campo: string;
  tipo: 'texto' | 'numero';
  operador: string;
  valor: any;
  valor2: any;   // solo para el operador "entre"
}

@Component({
  selector: 'app-inventariogeneral',
  templateUrl: './inventariogeneral.component.html',
  styleUrls: ['./inventariogeneral.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIcon,
    ButtonModule,
    DropdownModule,
    TableModule,
    InputTextModule,
    TooltipModule
  ]
})
export class InventariogeneralComponent implements OnInit {
  
  @ViewChild('resultadosBlock') resultadosBlock!: ElementRef;

  propietarios: SelectItem[] = [];
  almacenes:  SelectItem[] = [];
  model: any =  {};
  cols: any[];
  inventarios: InventarioGeneral[] = [] ;
  inventariosFiltrados: InventarioGeneral[] = [] ;
  grupos: SelectItem[] = [];
  filtroGeneral: string = '';

  // ─── Filtro avanzado (condiciones campo/operador/valor) ───────────────────
  // Las condiciones se combinan siempre con Y (deben cumplirse todas).
  mostrarAvanzado = false;
  condiciones: CondicionFiltro[] = [];

  /** Campos filtrables y su tipo (define qué operadores aplican). */
  readonly camposFiltro: { label: string; value: string; tipo: 'texto' | 'numero' }[] = [
    { label: 'Código',            value: 'codigo',           tipo: 'texto'  },
    { label: 'Descripción',       value: 'descripcionLarga', tipo: 'texto'  },
    { label: 'Lote',              value: 'lotNum',           tipo: 'texto'  },
    { label: 'LPN',               value: 'lodNum',           tipo: 'texto'  },
    { label: 'Estado',            value: 'estado',           tipo: 'texto'  },
    { label: 'Ubicación',         value: 'ubicacion',        tipo: 'texto'  },
    { label: 'Cantidad',          value: 'untQty',           tipo: 'numero' },
    { label: 'Cantidad separada', value: 'cantidadSeparada', tipo: 'numero' },
    { label: 'Stock disponible',  value: 'stockDisponible',  tipo: 'numero' },
  ];

  readonly operadoresTexto: SelectItem[] = [
    { value: 'contiene',   label: 'Contiene' },
    { value: 'nocontiene', label: 'No contiene' },
    { value: 'igual',      label: 'Igual a (exacto)' },
    { value: 'distinto',   label: 'Distinto de' },
    { value: 'empieza',    label: 'Empieza con' },
    { value: 'termina',    label: 'Termina con' },
    { value: 'vacio',      label: 'Está vacío' },
    { value: 'novacio',    label: 'No está vacío' },
  ];

  readonly operadoresNumero: SelectItem[] = [
    { value: 'eq',      label: 'Igual a (=)' },
    { value: 'neq',     label: 'Distinto de (≠)' },
    { value: 'gt',      label: 'Mayor que (>)' },
    { value: 'gte',     label: 'Mayor o igual (≥)' },
    { value: 'lt',      label: 'Menor que (<)' },
    { value: 'lte',     label: 'Menor o igual (≤)' },
    { value: 'between', label: 'Entre' },
  ];


    jwtHelper = new JwtHelperService();
    decodedToken: any = {};


  constructor(  
    private clienteService: ClienteService,
    private generealService: GeneralService,
    private propietarioService: PropietarioService,
    private reporteService: ReportesService
  ) { }

  ngOnInit() {
    // Inicializar inventariosFiltrados como array vacío
    this.inventariosFiltrados = [];

    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);


    console.log('Usuario:', this.decodedToken.unique_name);


    this.cols =
    [
      // { header: 'ALMACÉN', field: 'almacen', width: '180px' },
      { header: 'CÓDIGO', field: 'codigo', width: '180px' },
      { header: 'DESCRIPCIÓN', field: 'descripcionLarga', width: '350px' },

      { header: 'LOTE', field: 'lotNum', width: '120px' },
      { header: 'CANTIDAD', field: 'untQty', width: '80px' },
      { header: 'CANTIDAD SEPARADA', field: 'cantidadSeparada', width: '90px' },
      { header: 'STOCK DISPONIBLE', field: 'stockDisponible', width: '80px' },

      // { header: 'PESO', field: 'peso', width: '100px' },
      { header: 'ESTADO', field: 'estado', width: '150px' },
      // { header: 'REFERENCIA', field: 'referencia', width: '150px' },


      { header: 'LPN', field: 'lotNum', width: '120px' },
      
     
      // { header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px' },
      { header: 'UBICACIÓN', field: 'ubicacion', width: '120px' },

   
      // { header: 'F. EXPIRACIÓN', field: 'fechaExpire', width: '120px' },
      // { header: 'F. PRODUCCIÓN', field: 'fechaProduccion', width: '120px' },
   
     
   

      ];

    
 this.propietarioService.getAllPropietarios().subscribe(resp => {
    // Si el usuario es "mondelez", filtramos solo ese
    if (this.decodedToken.unique_name?.toLowerCase() === 'mondelez') {
      const mondelez = resp.find(x => 
        x.razonSocial?.toLowerCase().includes('mondelez')
      );
      if (mondelez) {
        this.propietarios = [
          { value: mondelez.id, label: mondelez.razonSocial }
        ];
        // Opcional: asignar por defecto
        this.model.IdPropietario = mondelez.id;
      }
    } else {
      // Si no es "mondelez", mostramos todos
      resp.forEach(x => {
        this.propietarios.push({ value: x.id, label: x.razonSocial });
      });
    }
  });


  this.clienteService.getAllGrupos().subscribe(resp => {

    resp.forEach(resp => {
      this.grupos.push({value: resp.id , label: resp.nombre });
    });
  

  });


  this.generealService.getAllAlmacenes().subscribe(resp2 => {


    resp2.forEach(element => {
      this.almacenes.push({ value: element.id ,  label : element.descripcion});
    });




  });



  }

  ver() {

    if (!this.model.IdGrupo && !this.model.IdPropietario) {
      alert('Debe seleccionar al menos un Grupo o un Propietario');
      return;
  }


    this.reporteService.getInventarioGeneral(this.model.IdGrupo, this.model.IdPropietario).subscribe(resp=> {
         this.inventarios = resp;
         this.aplicarFiltro();

         console.log( 'inventarios:',this.inventarios)
         
         // Scroll hasta el bloque de resultados después de un pequeño delay para asegurar que el DOM se haya actualizado
         setTimeout(() => {
           this.scrollToResultados();
         }, 100);
    })

  }

  scrollToResultados(): void {
    if (this.resultadosBlock) {
      this.resultadosBlock.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  // ─── Filtro avanzado: gestión de condiciones ─────────────────────────────

  agregarCondicion(): void {
    this.condiciones.push({ campo: 'codigo', tipo: 'texto', operador: 'contiene', valor: null, valor2: null });
    this.mostrarAvanzado = true;
  }

  quitarCondicion(i: number): void {
    this.condiciones.splice(i, 1);
    this.aplicarFiltro();
  }

  /** Al cambiar el campo, se reajusta el operador por defecto según su tipo. */
  onCampoChange(c: CondicionFiltro): void {
    const campo = this.camposFiltro.find(x => x.value === c.campo);
    c.tipo = campo?.tipo ?? 'texto';
    c.operador = c.tipo === 'numero' ? 'eq' : 'contiene';
    c.valor = null;
    c.valor2 = null;
    this.aplicarFiltro();
  }

  operadoresPara(c: CondicionFiltro): SelectItem[] {
    return c.tipo === 'numero' ? this.operadoresNumero : this.operadoresTexto;
  }

  esEntre(c: CondicionFiltro): boolean { return c.operador === 'between'; }

  /** "Está vacío" / "No está vacío" no necesitan valor. */
  requiereValor(c: CondicionFiltro): boolean {
    return c.operador !== 'vacio' && c.operador !== 'novacio';
  }

  /** Una condición se aplica solo si tiene los valores necesarios. */
  private condicionActiva(c: CondicionFiltro): boolean {
    if (!this.requiereValor(c)) return true;
    const tieneValor = c.valor !== null && c.valor !== undefined && `${c.valor}`.trim() !== '';
    if (!this.esEntre(c)) return tieneValor;
    const tieneValor2 = c.valor2 !== null && c.valor2 !== undefined && `${c.valor2}`.trim() !== '';
    return tieneValor && tieneValor2;
  }

  get condicionesActivas(): number {
    return this.condiciones.filter(c => this.condicionActiva(c)).length;
  }

  get hayFiltroActivo(): boolean {
    return !!(this.filtroGeneral && this.filtroGeneral.trim()) || this.condicionesActivas > 0;
  }

  limpiarFiltros(): void {
    this.filtroGeneral = '';
    this.condiciones = [];
    this.aplicarFiltro();
  }

  private cumpleCondicion(item: any, c: CondicionFiltro): boolean {
    const bruto = item?.[c.campo];

    if (c.tipo === 'numero') {
      const v = Number(bruto ?? 0);
      const a = Number(c.valor);
      if (isNaN(v) || isNaN(a)) return true;
      switch (c.operador) {
        case 'eq':  return v === a;
        case 'neq': return v !== a;
        case 'gt':  return v > a;
        case 'gte': return v >= a;
        case 'lt':  return v < a;
        case 'lte': return v <= a;
        case 'between': {
          const b = Number(c.valor2);
          if (isNaN(b)) return true;
          return v >= Math.min(a, b) && v <= Math.max(a, b);
        }
        default: return true;
      }
    }

    const s = (bruto ?? '').toString().toLowerCase().trim();
    const q = (c.valor ?? '').toString().toLowerCase().trim();
    switch (c.operador) {
      case 'contiene':   return s.includes(q);
      case 'nocontiene': return !s.includes(q);
      case 'igual':      return s === q;
      case 'distinto':   return s !== q;
      case 'empieza':    return s.startsWith(q);
      case 'termina':    return s.endsWith(q);
      case 'vacio':      return s === '';
      case 'novacio':    return s !== '';
      default: return true;
    }
  }

  aplicarFiltro(): void {
    const rapida = (this.filtroGeneral || '').toLowerCase().trim();
    const activas = this.condiciones.filter(c => this.condicionActiva(c));

    this.inventariosFiltrados = this.inventarios.filter((item: any) => {
      // 1) Búsqueda rápida (contiene, sobre código / descripción / lote)
      if (rapida) {
        const coincide = ['codigo', 'descripcionLarga', 'lotNum']
          .some(f => (item[f] ?? '').toString().toLowerCase().includes(rapida));
        if (!coincide) return false;
      }

      // 2) Condiciones avanzadas (deben cumplirse todas)
      if (activas.length === 0) return true;
      return activas.every(c => this.cumpleCondicion(item, c));
    });
  }

  onFiltroChange(): void {
    this.aplicarFiltro();
  }

  // Métodos para calcular totalizados (usando inventarios filtrados)
  get totalSKUs(): number {
    if (!this.inventariosFiltrados || this.inventariosFiltrados.length === 0) return 0;
    const skusUnicos = new Set(this.inventariosFiltrados.map(item => item.codigo).filter(codigo => codigo));
    return skusUnicos.size;
  }

  get totalCantidades(): number {
    if (!this.inventariosFiltrados || this.inventariosFiltrados.length === 0) return 0;
    return this.inventariosFiltrados.reduce((sum, item) => sum + (item.untQty || 0), 0);
  }

  get totalSeparados(): number {
    if (!this.inventariosFiltrados || this.inventariosFiltrados.length === 0) return 0;
    return this.inventariosFiltrados.reduce((sum, item) => sum + (item.cantidadSeparada || 0), 0);
  }
 exportar(){

  // Requerimiento: basta con IdCliente/Propietario
  if (!this.model.IdPropietario) {
    alert('Debe seleccionar Propietario para exportar.');
    return;
  }

  this.reporteService.exportarInventarioExcel(this.model.IdPropietario).subscribe({
    next: (res) => {
      const contentDisposition = res.headers?.get('content-disposition') || res.headers?.get('Content-Disposition');
      const fileName = this.getFilenameFromContentDisposition(contentDisposition) ?? 'Inventario.xlsx';
      const blob = res.body ?? new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, fileName);
    },
    error: (err) => {
      // Backend puede devolver JSON de error; cuando pedimos blob, llega como Blob
      const fallbackMsg = 'No se pudo descargar el reporte de inventario.';

      if (err?.error instanceof Blob) {
        err.error.text().then((t: string) => {
          try {
            const j = JSON.parse(t);
            alert(j?.message ?? fallbackMsg);
          } catch {
            alert(fallbackMsg);
          }
        }).catch(() => alert(fallbackMsg));
        return;
      }

      alert(err?.error?.message ?? fallbackMsg);
    }
  });
 }

 private getFilenameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  // Ej: attachment; filename="Inventario_1_20260216_123456.xlsx"
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(contentDisposition);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
 
 cargarClientes(){
  
  this.propietarios = [];

  this.propietarioService.getAllPropietarios().subscribe({
    next: response => {
    
      response.forEach((x) => {
          this.propietarios.push ({ label: x.razonSocial , value: x.id });
      });
    }
  });
}


}
