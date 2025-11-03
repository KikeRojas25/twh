import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { MessageService, PrimeNGConfig, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DespachosService } from '../../despachos/despachos.service';
import { AlmacenService } from '../../_services/almacen.service';
import { CicService } from '../../cic/cic.service';
import { ClienteService } from '../../_services/cliente.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrl: './batch.component.scss',
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
    ProgressBarModule
  ],
  providers: [
    MessageService
  ]
})
export class BatchComponent {
  @ViewChild('fileUpload', { static: false }) fileUpload!: FileUpload;
  
  files = [];
  totalSize : number = 0;
  totalSizePercent : number = 0;



  public errors = 0;
  public value = 0;
  public indeterminate = true;
  public min = -10;
  public max = 10;
  public chunks = 10;
  result:  any =[];
  public currentItem;
  public pageSizes = true;
  public pageSize = 200;
  public previousNext = true;
  public skip = 0;
  public allowUnsort = true;
  
  almacenes: SelectItem[] = [];
  clientes: SelectItem[] = [];
  model: any = {};

  public mySelection: number[] = [];

  divvisible = false;
  divprocesar = false;
  divprocesando = false;
  public progress: number;
  public message: string;
  fileData: File = null;
  previewUrl: any = null;
  fileUploadProgress: string = null;
  uploadedFilePath: string = null;
  userId: number;
    jwtHelper = new JwtHelperService();
    decodedToken: any = {};

  
  constructor( private authService: AuthService,
    private router: Router,
   private propietarioService: PropietarioService,
    private clienteService: ClienteService,
    private messageService: MessageService,
    private config: PrimeNGConfig,
    private almacenService: AlmacenService,
    private despachosService: DespachosService
    ) 
{


}

ngOnInit(): void {
    
    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);
    this.userId = this.decodedToken.nameid;


  
this.propietarioService.getAllPropietarios().subscribe(resp => {

  resp.forEach(resp => {
    this.clientes.push({value: resp.id , label: resp.razonSocial });
    
  });
  this.almacenService.getAllAlmacenes().subscribe(resp => {
    resp.forEach(item => {
      this.almacenes.push({ value: item.id, label: item.descripcion });
    });
});


});




}





choose(event: Event, chooseCallback: Function) {
chooseCallback(); // Llamada al callback interno de PrimeNG
}
upload() {
console.log(this.fileUpload.upload());
this.fileUpload.upload(); // Llama al método 'upload' del componente 'p-fileUpload'
}


onTemplatedUpload(event: any) {
  const files: File[] = event.files;

for (const file of this.files) {
  this.despachosService.uploadFileMasivo(
      this.userId,
      this.model.PropietarioId,
      this.model.AlmacenId,
      file
  ).subscribe({
    next: (response) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Archivo cargado',
        detail: 'El Excel se procesó correctamente',
        life: 3000
      });
    },
    error: (error) => {
      console.error('Error al subir archivo', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir el archivo',
        life: 3000
      });
      }
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

onRemoveTemplatingFile(event, file, removeFileCallback, index) {
removeFileCallback(event, index);
this.totalSize -= parseInt(this.formatSize(file.size));
this.totalSizePercent = this.totalSize / 10;
}

onClearTemplatingUpload(clear) {
clear();
this.totalSize = 0;
this.totalSizePercent = 0;
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
    this.despachosService.uploadFileMasivo(
      this.userId,
      this.model.PropietarioId,
      this.model.AlmacenId,
      file
    ).subscribe({
      next: (response: any) => {
        this.model.CargaId = response.idcarga;

        // ✅ Marcar como completado en PrimeNG
        if (!this.fileUpload.uploadedFiles.includes(file)) {
          this.fileUpload.uploadedFiles.push(file);
        }

        // ✅ Sacar de pending (limpiar de la lista interna y de la tuya)
        this.files = this.files.filter(f => f !== file);
        const index = this.fileUpload.files.indexOf(file);
        if (index !== -1) {
          this.fileUpload.files.splice(index, 1);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Archivo cargado',
          detail: 'El Excel se procesó correctamente',
          life: 3000
        });
      },
      error: (error) => {
        console.error('Error subiendo archivo', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo procesar el archivo',
          life: 3000
        });
      }
    });
  }
}

procesar(): void {
  const carga = {
    id: this.model.CargaId,           
    PropietarioId: this.model.PropietarioId,
    AlmacenId: this.model.AlmacenId,
    Usuario_Id: this.userId
  };

  this.despachosService.procesarMasivo(carga).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Procesado',
        detail: 'Órdenes de salida generadas correctamente',
        life: 3000
      });

      // 👇 limpiar el listado de archivos porque ya procesó
      this.files = [];
      this.model.CargaId = null;
    },
    error: (err) => {
      console.error('Error al procesar', err);

      // 🔎 Capturar el mensaje enviado por el backend
      const backendMessage = err?.error?.error || err.message || 'Error desconocido';

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `No se pudo procesar la carga masiva: ${backendMessage}`,
        life: 6000
      });
    }
  });
}


}