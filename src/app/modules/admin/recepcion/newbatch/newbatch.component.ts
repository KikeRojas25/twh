import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, PrimeNGConfig, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { RecepcionService } from '../recepcion.service';
import { GeneralService } from '../../_services/general.service';
import { ClienteService } from '../../_services/cliente.service';
import { REMOVE_STYLES_ON_COMPONENT_DESTROY } from '@angular/platform-browser';

@Component({
  selector: 'app-newbatch',
  templateUrl: './newbatch.component.html',
  styleUrls: ['./newbatch.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIcon,
    DynamicDialogModule ,
    DropdownModule ,
    CalendarModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    FileUploadModule ,
    ToastModule ,
    ProgressBarModule,
    ToastModule
  ],
  providers: [
    MessageService
  ]
})
export class NewbatchComponent implements OnInit {

  files = [];
  totalSize : number = 0;
  totalSizePercent : number = 0;
  almacenes: SelectItem[]  = [];
  clientes: SelectItem[] = [];
  model: any = {};
  datos : any []  = [];
  IdCarga: number;
  public correcto = false;



  constructor(
              private messageService: MessageService,
              private recepcionService: RecepcionService,
              private generealService: GeneralService,
              private clienteService: ClienteService,
              private config: PrimeNGConfig) 
              
              { 




              }

  ngOnInit() {

    this.cargaCombos();
  }

  cargaCombos() {
    this.generealService.getAllAlmacenes().subscribe(resp2 => {

      resp2.forEach(element => {
        this.almacenes.push({ value: element.id ,  label : element.descripcion});
      });
  
    });


    this.clienteService.getAllPropietarios('').subscribe(resp => {

      resp.forEach(resp => {
        this.clientes.push({value: resp.id , label: resp.razonSocial });
      });
    
  
    });




  }

  

  choose(event: Event, chooseCallback: Function) {
    chooseCallback(); // Llamada al callback interno de PrimeNG
  }
  upload() {
    // console.log(this.fileUpload.upload());
    // this.fileUpload.upload(); // Llama al método 'upload' del componente 'p-fileUpload'
  }


  onTemplatedUpload(event: any) {

    const files: File[] = event.files;
    for (const file of files) {
      this.recepcionService.uploadFile(this.model.PropietarioId, this.model.IdAlmacen, 1, file).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
        },
        error: (error) => {
          console.error('Error al cargar el archivo', error);
        },
      });
    }
  }


  onSelectedFiles(event) {
    this.files = event.currentFiles;
    this.files.forEach((file) => {
        this.totalSize += parseInt(this.formatSize(file.size));
    });
    this.totalSizePercent = this.totalSize / 10;
  }
   
uploadSelectedFiles() {
  if (this.files.length === 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No files selected',
      life: 3000
    });
    return;
  }

  for (const file of this.files) {
    this.recepcionService.uploadFile(this.model.PropietarioId, this.model.IdAlmacen, 1, file).subscribe((response) => {
     
   console.log('respu', response);
   this.datos = response.data;
   this.correcto  = response.correcto;

   if( response.correcto){
    this.IdCarga =  response.idcarga;

    this.messageService.add({
      severity: 'info',
      summary: 'Exitoso',
      detail:  `Archivo cargado ${this.IdCarga} ` ,
      life: 3000
    });


   }
   else {


    
    this.messageService.add({
      severity: 'warn',
      summary: 'Carga con errores',
      detail: 'El archivo presenta errores en la carga',
      life: 3000
    });

   }


        // const blob = new Blob([response], { type: 'application/zip' });
        // const url = window.URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = `BoletasMasivas_${Date.now}.zip`;
        // a.click();
        // window.URL.revokeObjectURL(url);





      }, error => {
        console.error('Error downloading the file', error);
      });

      


  }
}
  formatSize(bytes) {
    const k = 1024;
    const dm = 3;
    const sizes = this.config.translation.fileSizeTypes;
    if (bytes === 0) {
        return `0 ${sizes[0]}`;
    }
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  
    return `${formattedSize} ${sizes[i]}`;
  }


  procesarFile () {

    this.model.idcarga   = this.IdCarga;

    this.recepcionService.procesarCarga ( this.model.idcarga
      , this.model.IdAlmacen 
      , this.model.PropietarioId ).subscribe(resp => {
  
  

      this.messageService.add({
        severity: 'success',
        summary: 'Exitoso',
        detail: 'Archivo cargado con éxito',
        life: 3000
      });


      // success('Se han generado las ordenes de ingreso'
      // , 'Subir File', {
      //   closeButton: true
      // });
  
     // this.router.navigate(['/recibo/listaordenrecibo',  this.model ]);
  
  
     
    });
  
  
  }
}
