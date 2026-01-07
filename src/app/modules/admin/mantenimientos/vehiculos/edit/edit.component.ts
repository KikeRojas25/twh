import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MantenimientoService } from '../../mantenimiento.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone:true,
      imports: [
            InputTextModule, 
            DropdownModule,
            FormsModule,
            ButtonModule,
            TableModule,
            CommonModule,
            DialogModule   ,
            DynamicDialogModule ,
            ToastModule,
            CalendarModule,
            ConfirmDialogModule,
            MatIcon,
            IconFieldModule,
            InputIconModule,
            InputMaskModule ,
            InputNumberModule
          ],
          providers: [
            MessageService ,
            ConfirmationService     
          ]
})
export class EditComponent implements OnInit {

 
   proveedores: SelectItem[] = [];
   model: any = {};
   cargandoProveedores = false;  
     marcas: SelectItem[] = [];
     tiposVehiculo:SelectItem[] = [];
 
 
   constructor(private mantenimientoService: MantenimientoService,
           private generalService: GeneralService,
           private ref: DynamicDialogRef,
           private confirmationService: ConfirmationService ,
           public config: DynamicDialogConfig,
           private messageService: MessageService) {





            }
 
   ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    forkJoin({
      marcas: this.generalService.getValorTabla(5),
      tipos: this.generalService.getValorTabla(4),
      proveedores: this.mantenimientoService.GetAllProveedor()
    }).subscribe({
      next: ({ marcas, tipos, proveedores }) => {
        this.marcas = marcas.map(m => ({ label: m.valorPrincipal, value: m.id }));
        this.tiposVehiculo = tipos.map(t => ({ label: t.valorPrincipal, value: t.id }));
        this.proveedores = proveedores.map(p => ({ label: p.razonSocial, value: p.id }));
        this.cargandoProveedores = false;

        const vehiculoId = this.config.data?.vehiculoId;
        if (vehiculoId) {
          this.obtenerVehiculo(vehiculoId);
        }
      },
      error: err => {
        console.error('Error al cargar datos iniciales', err);
        this.cargandoProveedores = false;
      }
    });
  }


   
   cargarDropdown() {
    
     this.generalService.getValorTabla(5).subscribe(resp =>    {
 
       console.log(resp);
         resp.forEach(element => {
           this.marcas.push({ value: element.id , label: element.valorPrincipal});
         });
 
       });
 
       this.generalService.getValorTabla(4).subscribe(resp =>
         {
           resp.forEach(element => {
             this.tiposVehiculo.push({ value: element.id , label: element.valorPrincipal});
           });
   
         });
   }
   cargarDropdownProveedores() {
     this.mantenimientoService.GetAllProveedor().subscribe({
       next: (data) => {
 
      
         this.proveedores = data.map(p => ({
           label: p.razonSocial, // o lo que corresponda
           value: p.id
       }));
 
 
 
     },
     error: (err) => {
         console.error('Error al cargar proveedores', err);
     },
     complete: () => {
         this.cargandoProveedores = false;
     } 
   
   
   });
   }
   obtenerVehiculo(id: number) {
    this.mantenimientoService.getVehiculoById(id).subscribe({
      next: (data) => {

        console.log('Vehículo:', data);

        this.model = {
          id: data.id,
          placa: data.placa,
          marcaid: data.marcaId || data.marcaid,
          tipoid: data.tipoId || data.tipoid,
          cargaUtil: data.cargaUtil,
          pesoBruto: data.pesoBruto,
          proveedorId: data.proveedorId || data.proveedorid
        };
      },
      error: (err) => {
        console.error('Error al obtener el vehículo', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener la información del vehículo'
        });
      }
    });
  }

  actualizarVehiculo(): void {
    // Validar que los campos requeridos estén presentes
    if (!this.model.placa || !this.model.marcaid || !this.model.tipoid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: '¿Está seguro que desea actualizar el vehículo?',
      header: 'Actualizar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Preparar el objeto con todos los campos necesarios
        const vehiculoActualizar = {
          id: this.model.id,
          placa: this.model.placa?.toUpperCase() || this.model.placa,
          marcaId: this.model.marcaid,
          tipoId: this.model.tipoid,
          cargaUtil: this.model.cargaUtil || 0,
          pesoBruto: this.model.pesoBruto || 0,
          proveedorId: this.model.proveedorId || null
        };

        console.log('Actualizando vehículo:', vehiculoActualizar);

        this.mantenimientoService.actualizarVehiculo(this.model.id, vehiculoActualizar).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Actualización exitosa',
              detail: res.message || 'El vehículo se ha actualizado correctamente'
            });
            this.ref?.close(true); // Cierra modal y notifica que se actualizó
          },
          error: (err) => {
            console.error('Error al actualizar vehículo:', err);
            const mensaje = err.error?.message || err.error?.error || 'Error al actualizar vehículo';
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
  
  
   cerrarModal() { 
          this.ref?.close();
      }
 
 
 }
 