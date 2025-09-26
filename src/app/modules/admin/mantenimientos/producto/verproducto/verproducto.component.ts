import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ProductoService } from '../../../_services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button'; 
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { NewedithuellaComponent } from '../newedithuella/newedithuella.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-verproducto',
  standalone: true,
  imports: [
    MatIcon,
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule
  ],
  providers: [
    DialogService,
    MessageService
  ],
  templateUrl: './verproducto.component.html',
  styleUrl: './verproducto.component.scss'
})
export class VerproductoComponent implements OnInit{

  id: any;
  model: any = {};
  huellas: any[] = [];
  total = 0;
  huella: number;
  ref: DynamicDialogRef | undefined;
  form: FormGroup;

  constructor(
      private productoService: ProductoService,
      private activatedRoute: ActivatedRoute,
      public dialogService: DialogService,
      private router: Router,
      public messageService: MessageService,
    ){}

  ngOnInit(){

    this.id  = this.activatedRoute.snapshot.params.id;
    this.productoService.get(this.id).subscribe(result => {
        this.model = result;
    });

    this.buscarHuella(this.id);
  }

  buscarHuella(id: number){
    this.productoService.getHuellas(id).subscribe(result => {
      result.forEach(x =>  {
        console.log(x.cantidad);
        this.total = this.total +  x.cantidad ;
      }
      );
      result.forEach(x =>  {
        x.cantidad = ( x.cantidad * 100) / this.total  ;
     });
      this.huellas = result;

      console.log(this.huellas)
    });
  }

  nuevaHuella(id: number){
    this.ref = this.dialogService.open(NewedithuellaComponent, {
      header: 'Datos de Huella',
      width: '420px',
      height: '350px',
      data: {productoId : id, esNuevo : true}
    });
      
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscarHuella(this.id);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Huella guardada', 
          detail: 'Se ha guardado la huella.' 
        }); 
      }
    }); 
  }
    
  editarHuella(id : number){
    console.log(id)
    this.ref = this.dialogService.open(NewedithuellaComponent, {
      header: 'Datos de Huella',
      width: '420px',
      height: '350px',
      data: {productoId: id, esNuevo : false}
    });
    this.ref.onClose.subscribe((actualizado) => {
      if (actualizado) {
        this.buscarHuella(this.id); 
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Huella guardada', 
          detail: 'Se ha guardado la huella.' 
        }); 
      }
    });
  }

  verHuella(id : number){
    console.log(id)
    console.log(this.id)
    this.router.navigate(['/mantenimiento/huelladetalle', id, this.id]);
  }

  regresar(){
    this.router.navigate(['mantenimiento/listadoproducto']);
  }

}
