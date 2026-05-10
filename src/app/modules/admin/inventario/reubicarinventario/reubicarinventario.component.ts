import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { InventarioGeneral } from '../../_models/inventariogeneral';
import { ClienteService } from '../../_services/cliente.service';

import { GeneralService } from '../../_services/general.service';
import { VerubicacionComponent } from './verubicacion/verubicacion.component';
import { ProductoService } from '../../_services/producto.service';
import { InventarioService } from '../../_services/inventario.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-reubicarinventario',
  standalone: true,
  imports: [
    MatIcon,
    TableModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [
    ConfirmationService,
    MessageService,
    DialogService
  ],
  templateUrl: './reubicarinventario.component.html',
  styleUrl: './reubicarinventario.component.scss'
})
export class ReubicarinventarioComponent implements OnInit{

  clientes: SelectItem[] = [];
  productos: SelectItem[] = [];
  estadoInventario: SelectItem[] = [];
  listData: InventarioGeneral[];
  areas: SelectItem[] = [];
  cols: any[];
  model: any = {};
  seleccion: InventarioGeneral[] = [];
  ref: DynamicDialogRef | undefined;
  public loading = false;
  selectedLPNs: any[] = [];
  almacenes: SelectItem[] = [];

  constructor(
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private inventarioService: InventarioService,
    private productoService: ProductoService,
    private generalService: GeneralService,
    private dialogService: DialogService,
    private messageService: MessageService,
  ) { }

  ngOnInit() : void{

    this.cols =
    [
      {header: 'ACCIONES', field: 'acciones' , width: '60px' },
      {header: 'PROPIETARIO', field: 'propietario'  ,  width: '120px'  },
      {header: 'UBICACIÓN', field: 'ubicacion'  ,  width: '90px'  },
      {header: 'LPN', field: 'lodNum'  ,  width: '90px' },
      {header: 'PRODUCTO', field: 'descripcionLarga'  ,  width: '180px' },
      {header: 'QTY', field: 'untQty' , width: '50px'  },
    ];


    this.generalService.getAllAlmacenes().subscribe(resp => {
      this.almacenes = resp.map(element => ({
        value: element.id,
        label: element.descripcion
      }));
    });

    this.generalService.getAreas().subscribe(resp =>
    {
      resp.forEach(element => {
        this.areas.push({
          value: element.id ,
          label: element.nombre
        });
      });
    });

    this.generalService.getAll(3).subscribe(resp =>
    {
      resp.forEach(element => {
        this.estadoInventario.push({
          value: element.id ,
          label: element.nombreEstado
        });
      });
    });

    this.propietarioService.getAllPropietarios().subscribe(resp => {
        resp.forEach(element => {
          this.clientes.push({ label: element.razonSocial.toUpperCase() , value: element.id });
      });
    });

  }

  CambioCliente(id) {
    this.productoService.getAllProductos('', id.value).subscribe(resp => {
      this.productos = resp.map(element => ({
        label: element.descripcionLarga,
        value: element.id
      }));
    });
  }

  buscar(){
    this.selectedLPNs = [];

    if (!this.model.AlmacenId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Debe seleccionar un almacén.'
      });
      return;
    }

    const clienteId = this.model.PropietarioId || '';
    const productoId = this.model.ProductoId || '';
    const lpn = this.model.lpn || '';
    const ubicacion = this.model.ubicacion || '';
    const almacenId = this.model.AlmacenId;

    this.seleccion = [];

    this.inventarioService.getAllInventarioReubicacionAgrupado(
      clienteId,
      productoId,
      lpn,
      ubicacion,
      almacenId
    ).subscribe(list => {
      this.listData = list;
    });
  }

  ver(rowData: any){
    const origenes = [this.toOrigen(rowData)];

    this.ref = this.dialogService.open(VerubicacionComponent, {
      header: 'Reubicar pallet',
      width: '720px',
      data: {
        origenes,
        almacenId: this.model.AlmacenId,
        almacen: this.almacenLabel(this.model.AlmacenId),
      }
    });

    this.ref.onClose.subscribe((result) => {
      if (result === true) {
        this.buscar();
        this.messageService.add({
          severity: 'success',
          summary: 'Reubicación completada',
          detail: 'El pallet fue reubicado correctamente.'
        });
      }
    });
  }

  cambiarMasivo() {
    if (!this.selectedLPNs?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Selección vacía',
        detail: 'Seleccione al menos un pallet para reubicar.'
      });
      return;
    }

    const almacenIds = Array.from(
      new Set(this.selectedLPNs.map((x: any) => x.almacenId).filter(v => v != null))
    );
    if (almacenIds.length > 1) {
      this.messageService.add({
        severity: 'error',
        summary: 'Almacenes mezclados',
        detail: 'No se puede reubicar masivamente pallets de almacenes distintos. Filtre por un solo almacén.'
      });
      return;
    }

    const origenes = this.selectedLPNs.map((x: any) => this.toOrigen(x));

    this.ref = this.dialogService.open(VerubicacionComponent, {
      header: origenes.length === 1 ? 'Reubicar pallet' : `Reubicar ${origenes.length} pallets`,
      width: '720px',
      data: {
        origenes,
        almacenId: this.model.AlmacenId,
        almacen: this.almacenLabel(this.model.AlmacenId),
      }
    });

    this.ref.onClose.subscribe((result) => {
      if (result === true) {
        this.buscar();
        this.messageService.add({
          severity: 'success',
          summary: 'Reubicación completada',
          detail: origenes.length === 1
            ? 'El pallet fue reubicado correctamente.'
            : `${origenes.length} pallets reubicados correctamente.`
        });
      }
    });
  }

  private toOrigen(row: any) {
    return {
      id: row?.id,
      lpn: row?.lodNum,
      ubicacion: row?.ubicacion,
      ubicacionId: row?.ubicacionId,
      almacen: row?.almacen ?? this.almacenLabel(this.model.AlmacenId),
      almacenId: row?.almacenId ?? this.model.AlmacenId,
      producto: row?.descripcionLarga,
      qty: row?.untQty,
    };
  }

  private almacenLabel(id: any): string {
    return this.almacenes.find(a => a.value === id)?.label ?? '';
  }

}
