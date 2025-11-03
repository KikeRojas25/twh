import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';

import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TransporteService } from '../../transporte.service';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { ClienteService } from 'app/modules/admin/_services/cliente.service';
import { TarifarioService } from '../tarifario.service';
import { PropietarioService } from 'app/modules/admin/_services/propietario.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone:true,
  imports:[
    DropdownModule,
    InputTextModule,
    FormsModule,
    MatIcon,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [
    MessageService ,
    ConfirmationService     
  ]
})
export class EditComponent implements OnInit {

  model: any = {};
  clientes:SelectItem[] = [];
  tiposVehiculo:SelectItem[] = [];
  provincias:SelectItem[] = [];
  distritos:SelectItem[] = [];
  distritosFiltrados: SelectItem[] = [];
  constructor(
         
        private tarifarioService: TarifarioService,
        private messageService: MessageService,
        public dialogService: DialogService,
        private generalService: GeneralService,
        private ref: DynamicDialogRef,
        private confirmationService: ConfirmationService ,
        private clienteService: ClienteService,
        private propietarioService: PropietarioService,
        private router: Router,
        public config: DynamicDialogConfig,
  ) { }

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    forkJoin({
      clientes:   this.propietarioService.getAllPropietarios(),
      tiposVehiculo: this.generalService.getValorTabla(4),
      provincias: this.generalService.GetAllProvincias(''),
      // distritos: this.mantenimientoService.GetDistritos(0)
    }).subscribe({
      next: ({ clientes, tiposVehiculo, provincias }) => {
        this.clientes = clientes.map(m => ({ label: m.razonSocial, value: m.id }));
        this.tiposVehiculo = tiposVehiculo.map(t => ({ label: t.valorPrincipal, value: t.id }));
        this.provincias = provincias.map(p => ({ label: p.provincia, value: p.idprovincia }));
      

        const tarifaId = this.config.data?.tarifaid;
        if (tarifaId) {
          this.obtenerTarifa(tarifaId);
        }
      },
      error: err => {
        console.error('Error al cargar datos iniciales', err);
        // this.cargandoProveedores = false;
      }
    });
  }

  obtenerTarifa(id: number) {
    this.tarifarioService.obtenerPorId(id).subscribe({
      next: (data) => {

        console.log('Tarifa:', data);

        this.model = {
          ...data,
          // Asegúrate de que los siguientes campos sean los `value` (ids) del dropdown
          IdProveedor: data.idProveedor, // si usas ID para marcas
          IdTipoUnidad: data.idTipoUnidad,
          // IdProvincia_Destino: data.idProvincia_Destino,
          // IdDistrito_Destino: data.idDistrito_Destino
        };
        if (this.model.IdProvincia_Destino) {
          this.generalService.GetDistritos(this.model.IdProvincia_Destino).subscribe(resp => {
            this.distritosFiltrados = resp.map(x => ({
              value: x.idDistrito,
              label: x.distrito
            }));
          });
        }
      },
      error: (err) => {
        console.error('Error al obtener la tarifa', err);
      }
    });
  }


  cargarDropdown() {
   
    this.propietarioService.getAllPropietarios().subscribe(resp =>    {
        resp.forEach(element => {
          this.clientes.push({ value: element.id , label: element.razonSocial});
        });
      });

    this.generalService.getValorTabla(4).subscribe(resp =>
      {
        resp.forEach(element => {
          this.tiposVehiculo.push({ value: element.id , label: element.valorPrincipal});
        });

      });

    this.generalService.GetAllProvincias('').subscribe(resp=> 
      {
        resp.forEach(x=> {
          this.provincias.push({value: x.idprovincia , label: x.provincia});
        })
      });
  }

  onProvinciaChange() {
    const idProvincia = this.model.IdProvincia_Destino;
    this.model.IdDistrito_Destino = null;
    if (idProvincia) {
      
      this.generalService.GetDistritos(idProvincia).subscribe(resp => {
        console.log(resp)
        this.distritosFiltrados = resp.map(x => ({
          value: x.idDistrito,
          label: x.distrito
        }));
      });
      
    } else {
      this.distritosFiltrados = [];
    }
  }

  cerrarModal() { 
    this.ref?.close();
  }

  ActualizarTarifa() {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea actualizar la tarifa?',
      header: 'Actualizar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => { 
        console.log(this.model);
        this.tarifarioService.editar(this.model.id,this.model).subscribe({
          next: (data) => {
            this.messageService.add({severity:'success', summary:'Tarifa actualizada', detail:'La tarifa se ha registrado correctamente'});
            this.ref?.close(true);
          },
          error: err => {
            // Captura el mensaje del backend
            const mensaje = err.error?.message || 'Error inesperado';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: mensaje
            });
          },
          complete: () => {
            this.router.navigate(['mantenimiento/tarifario/list']);
          }
        });
      },
      reject: () => {

      }
    });
  }

}
