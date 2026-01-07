import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MantenimientoService } from '../../mantenimiento.service';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { NewConductorComponent } from '../new/new.component';
import { EditConductorComponent } from '../edit/edit.component';

@Component({
  selector: 'app-list-conductores',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [
    InputTextModule, 
    DropdownModule,
    FormsModule,
    ButtonModule,
    TableModule,
    CommonModule,
    DialogModule,
    TimelineModule,
    CardModule,
    DynamicDialogModule,
    ToastModule,
    CalendarModule,
    ConfirmDialogModule,
    MatIcon,
    IconFieldModule,
    InputIconModule,
    InputMaskModule,
    InputNumberModule
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ]
})
export class ListConductoresComponent implements OnInit {

  conductores: any[] = [];
  model: any = {};
  cargandoConductores = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    private mantenimientoService: MantenimientoService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.cargandoConductores = true;
    
    // Obtener todos los conductores
    // Si hay un filtro de búsqueda, se puede agregar aquí
    this.mantenimientoService.getAllConductores().subscribe({
      next: (data) => {
        // Filtrar por búsqueda si existe
        let conductoresFiltrados = data || [];
        
        if (this.model.busqueda && this.model.busqueda.trim()) {
          const busqueda = this.model.busqueda.trim().toLowerCase();
          conductoresFiltrados = conductoresFiltrados.filter((c: any) => {
            const nombreCompleto = (c.nombreCompleto || c.NombreCompleto || '').toLowerCase();
            const dni = (c.dni || c.Dni || '').toString().toLowerCase();
            const brevete = (c.brevete || c.Brevete || '').toString().toLowerCase();
            
            return nombreCompleto.includes(busqueda) ||
                   dni.includes(busqueda) ||
                   brevete.includes(busqueda);
          });
        }
        
        this.conductores = conductoresFiltrados;
      },
      error: (err) => {
        console.error('Error al cargar conductores', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los conductores'
        });
      },
      complete: () => {
        this.cargandoConductores = false;
      }
    });
  }

  nuevo() {
    this.ref = this.dialogService.open(NewConductorComponent, {
      header: 'Nuevo conductor',
      width: '700px',
      height: '600px',
      data: {}
    });

    this.ref.onClose.subscribe((guardado) => {
      if (guardado) {
        this.buscar(); // Refresca la lista
      }
    });
  }

  editar(id: number) {
    this.ref = this.dialogService.open(EditConductorComponent, {
      header: 'Editar conductor',
      width: '700px',
      height: '600px',
      data: { conductorId: id }
    });

    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscar(); // Refresca la lista
      }
    });
  }

  eliminar(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el conductor?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.mantenimientoService.eliminarConductor(id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminación exitosa',
              detail: res.message || 'El conductor se ha eliminado correctamente'
            });
            this.buscar(); // Refresca la lista
          },
          error: (err) => {
            console.error('Error al eliminar conductor:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al eliminar conductor';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          }
        });
      },
      reject: () => {
        // Usuario canceló la operación
      }
    });
  }

  exportarExcel() {
    // TODO: Implementar exportación a Excel
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: 'Funcionalidad de exportar a Excel pendiente'
    });
  }
}

