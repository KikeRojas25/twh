import { Component, OnInit } from '@angular/core';
import { InventarioService } from '../../_services/inventario.service';
import { ReportesService } from '../reportes.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ReporteAjusteInventario } from '../reportes.types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { ClienteService } from '../../_services/cliente.service';
import { SelectItem } from 'primeng/api';
import { MatIcon } from '@angular/material/icon';

import moment from 'moment';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-movimientoubicaciones',
  templateUrl: './movimientoubicaciones.component.html',
  styleUrls: ['./movimientoubicaciones.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule,
    PanelModule,
    MatIcon,
    CalendarModule
  ],
  providers: [ ]
})
export class MovimientoubicacionesComponent implements OnInit {

data: ReporteAjusteInventario[] = [];
cols: any[] = [];
model: any = {};




fecIni: Date = new Date();  // o null por defecto
fecFin: Date = new Date();  // o null por defecto

  clientes: SelectItem[] = [];

  constructor(private ajusteService: ReportesService,
    private clienteService: ClienteService,
  ) {}

  ngOnInit(): void {
    this.cols = [
      { field: 'lodNum', header: 'LPN' },
      { field: 'propietario', header: 'Propietario' },
      { field: 'antigua', header: 'Ubicación Antigua' },
      { field: 'nueva', header: 'Ubicación Nueva' },
      { field: 'fechaHoraAjuste', header: 'Fecha Ajuste' }
    ];


    

    this.clienteService.getAllPropietarios('').subscribe(resp => {

      resp.forEach(resp => {
        this.clientes.push({value: resp.id , label: resp.razonSocial });
      });
    

    });

    this.buscar();
  }

  buscar(): void {

  const inicioStr = this.fecIni ? moment(this.fecIni).format('DD/MM/YYYY') : '';
  const finStr = this.fecFin ? moment(this.fecFin).format('DD/MM/YYYY') : '';


  this.ajusteService.getReporteAjusteInventario(this.model.PropietarioId, inicioStr, finStr).subscribe(resp => {
    this.data = resp;
  });


  }

  exportToExcel(): void {
    const exportData = this.data.map(d => ({
      'LPN': d.lodNum,
      'Propietario': d.propietario,
      'Ubicación Antigua': d.antigua,
      'Ubicación Nueva': d.nueva,
      'Fecha Ajuste': d.fechaHoraAjuste,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { 'Reporte': worksheet }, SheetNames: ['Reporte'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'ReporteAjustesInventario.xlsx');
  }
}