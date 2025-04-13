import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CicService } from '../cic.service';

@Component({
  selector: 'app-masivocomprobantes',
  templateUrl: './masivocomprobantes.component.html',
  styleUrls: ['./masivocomprobantes.component.css'],
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
export class MasivocomprobantesComponent implements OnInit {

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

  constructor( private authService: AuthService,
              private router: Router,
              private cicService: CicService,
              private messageService: MessageService,
              private config: PrimeNGConfig
              ) 
    {


    }

  ngOnInit(): void {

    this.userId = 2;
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
    for (const file of files) {
      this.cicService.uploadFile(1, file).subscribe({
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
    this.cicService.uploadFile(1, file).subscribe((response: Blob) => {
     


        const blob = new Blob([response], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BoletasMasivas_${Date.now}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);


        this.messageService.add({
          severity: 'info',
          summary: 'Exitoso',
          detail: 'Archivo cargado',
          life: 3000
        });



      }, error => {
        console.error('Error downloading the file', error);
      });

      


  }
}

  procesar(): void {


  }
}
