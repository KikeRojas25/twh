import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { GeneralService } from '../../_services/general.service';
import { PropietarioService } from '../../_services/propietario.service';
import { ProductoService } from '../../_services/producto.service';
import { ReportesService } from '../reportes.service';

@Component({
  selector: 'app-kardexproductos',
  templateUrl: './kardexproductos.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    ButtonModule,
    DropdownModule,
    TableModule,
    InputTextModule,
    CalendarModule,
    TooltipModule,
  ]
})
export class KardexproductosComponent implements OnInit {

  @ViewChild('resultadosBlock') resultadosBlock!: ElementRef;

  almacenes: SelectItem[] = [];
  propietarios: SelectItem[] = [];
  productos: SelectItem[] = [];

  model: any = {};
  movimientos: any[] = [];
  descripcion = '';
  codigo = '';
  stockInventario: number = 0;
  stockSeparado: number = 0;

  dateInicio: Date = new Date();
  dateFin: Date = new Date();
  nroGuia = '';

  cargando = false;
  buscado = false;

  constructor(
    private generalService: GeneralService,
    private propietarioService: PropietarioService,
    private productoService: ProductoService,
    private reportesService: ReportesService
  ) {}

  ngOnInit() {
    this.generalService.getAllAlmacenes().subscribe(resp => {
      this.almacenes = [
        { value: null, label: 'Todos' },
        ...resp.map(a => ({ value: a.id, label: a.descripcion }))
      ];
    });

    this.propietarioService.getAllPropietarios().subscribe(resp => {
      this.propietarios = resp.map(p => ({ value: p.id, label: p.razonSocial }));
    });
  }

  onPropietarioChange() {
    this.productos = [];
    this.model.productoId = null;
    this.movimientos = [];
    this.buscado = false;
    if (!this.model.propietarioId) return;

    this.productoService.getAllProductos('', this.model.propietarioId).subscribe(resp => {
      this.productos = resp.map(p => ({
        value: p.id,
        label: `${p.codigo} - ${p.descripcionLarga}`
      }));
    });
  }

  buscar() {
    if (!this.model.propietarioId) { alert('Seleccione un propietario.'); return; }
    if (!this.model.productoId)    { alert('Seleccione un producto.'); return; }
    if (!this.dateInicio || !this.dateFin) { alert('Seleccione el rango de fechas.'); return; }

    this.cargando = true;
    this.buscado = false;

    this.reportesService.getKardexPorProducto(
      this.model.propietarioId,
      this.model.productoId,
      this.formatDate(this.dateInicio),
      this.formatDate(this.dateFin),
      this.model.almacenId
    ).subscribe({
      next: (res) => {
        this.descripcion     = res.descripcion;
        this.codigo          = res.codigo;
        this.stockInventario = res.stockInventario;
        this.stockSeparado   = res.stockSeparado;
        this.movimientos     = res.movimientos || [];
        this.buscado = true;
        this.cargando = false;
        setTimeout(() => this.scrollToResultados(), 100);
      },
      error: () => {
        alert('Error al obtener los datos del kardex.');
        this.cargando = false;
      }
    });
  }

  getCantidadClass(cantidad: number): string {
    return cantidad < 0
      ? 'inline-block font-semibold text-white bg-red-500 px-2 py-0.5 rounded text-xs'
      : 'inline-block font-semibold text-white bg-green-600 px-2 py-0.5 rounded text-xs';
  }

  private formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
  }

  private scrollToResultados() {
    this.resultadosBlock?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
