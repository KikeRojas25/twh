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
import { JwtHelperService } from '@auth0/angular-jwt';
import { PropietarioService } from '../../_services/propietario.service';
import * as FileSaver from 'file-saver';

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
    InputTextModule
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

  aplicarFiltro(): void {
    if (!this.filtroGeneral || this.filtroGeneral.trim() === '') {
      this.inventariosFiltrados = [...this.inventarios];
    } else {
      const filtro = this.filtroGeneral.toLowerCase().trim();
      this.inventariosFiltrados = this.inventarios.filter(item => {
        const codigo = (item.codigo || '').toLowerCase();
        const descripcion = (item.descripcionLarga || '').toLowerCase();
        const lote = (item.lotNum || '').toLowerCase();
        return codigo.includes(filtro) || descripcion.includes(filtro) || lote.includes(filtro);
      });
    }
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
