import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { SelectItem, ConfirmationService } from 'primeng/api';
import { GeneralService } from '../../../_services/general.service';
import { ProductoService } from '../../../_services/producto.service';
import { forkJoin } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TwoDigitDecimaNumberDirective } from '../../../../../directives/two-digit-decima-number.directive'

@Component({
  selector: 'app-newhuelladetalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ConfirmDialogModule,
    TwoDigitDecimaNumberDirective
  ],
  providers: [
    ConfirmationService,
  ],
  templateUrl: './newhuelladetalle.component.html',
  styleUrl: './newhuelladetalle.component.scss'
})
export class NewhuelladetalleComponent implements OnInit{

  model: any = {};
  form: FormGroup;
  unidadesmedida: SelectItem[] = [];

  constructor(
    private ref: DynamicDialogRef,
    private router: Router,
    private config: DynamicDialogConfig,
    private generalService: GeneralService,
    private productoService: ProductoService,
    private confirmationService: ConfirmationService,
  ){}

  ngOnInit() {
    const idHuella = this.config.data?.id;
    this.cargarCombosYDetalleHuella();
    if(idHuella > 0){
      this.model.huellaId = idHuella;
    }
  }

  cargarCombosYDetalleHuella() {
      const unidades$ = this.generalService.getValorTabla(9);
      forkJoin([unidades$]).subscribe({
        next: ([unidades]) => {
          this.unidadesmedida = unidades.map(u => ({ value: u.id, label: u.valorPrincipal }));
  
          //Editar
          // const productoId = this.config.data?.productoId;
          // if (productoId) {
          //   this.productoService.get(productoId).subscribe((producto) => {
          //     console.log('Producto recibido:', producto);
          //     this.model = { ...producto };
          //   });
          // }
        },
        error: (err) => {
          console.error('Error al cargar combos', err);
        }
      });
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  save(){
    this.confirmationService.confirm({
      acceptLabel: 'Guardar',                   // Texto del botón "Aceptar"
      rejectLabel: 'Cancelar',                  // Texto del botón "Rechazar"
      acceptIcon: 'pi pi-check',                // Icono del botón "Aceptar"
      rejectIcon: 'pi pi-times',                // Icono del botón "Rechazar"
      message: '¿Está seguro que desea guardar el Detalle de la Huella?',
      header: 'Confirmar Guardado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productoService.registrarHuellaDetalle(this.model).subscribe(resp => {
        }, error => {
    
        }, () => {
          this.ref.close(true);
        });
      } ,
      reject: () => {
      }
    });
  }

  close(){
    this.ref?.close();
  }

}
