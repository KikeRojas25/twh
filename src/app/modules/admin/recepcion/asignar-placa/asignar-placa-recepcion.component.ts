import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { MantenimientoService } from 'app/modules/admin/mantenimientos/mantenimiento.service';
import { GeneralService } from 'app/modules/admin/_services/general.service';
import { RecepcionService } from '../recepcion.service';

@Component({
  selector: 'app-asignar-placa-recepcion',
  templateUrl: './asignar-placa-recepcion.component.html',
  styleUrls: ['./asignar-placa-recepcion.component.css'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      AutoCompleteModule,
      ButtonModule,
      DropdownModule
  
    ]
})
export class AsignarPlacaRecepcionComponent implements OnInit {

  id: any;

  @Input() drivers: any[] = []; // Lista completa de conductores
  @Output() driverSelected = new EventEmitter<any>(); // Emitir el conductor seleccionado


  
  @Input() tractos: any[] = []; // Lista completa de conductores
  @Output() tractoSelected = new EventEmitter<any>(); // Emitir el conductor seleccionado


  @Input() carretas: any[] = []; // Lista completa de conductores
  @Output() carretasSelected = new EventEmitter<any>(); // Emitir el conductor seleccionado


  selectedTracto: any; // Conductor seleccionado
  filteredTracto: any[] = []; // Resultados del autocomplete


  selectedCarreta: any; // Conductor seleccionado
  filteredCarreta: any[] = []; // Resultados del autocomplete

  public listValorTabla: SelectItem[]= [];


  selectedDriver: any; // Conductor seleccionado
  filteredDrivers: any[] = []; // Resultados del autocomplete

  public selectedValorTabla: any;

  constructor(private commonService: MantenimientoService,
    public ref: DynamicDialogRef,
    private recepcionService: RecepcionService,
    private generalSercice: GeneralService,
    public config: DynamicDialogConfig  ,
    private confirmationService: ConfirmationService,
  ) { 

    this.id = config.data.id;

  }

  ngOnInit() {

    this.commonService.getAllConductores().subscribe((drivers) => {
      this.drivers = drivers; // Guarda todos los conductores
     //console.log('drivers', this.drivers);
    });


    this.commonService.getAllVehiculos('').subscribe((tractos) => {
      this.tractos = tractos; // Guarda todos los conductores
      this.carretas  = tractos;
      console.log('tractos', this.tractos);
    });


    this.generalSercice.getValorTabla(4).subscribe((list3) => {
      list3.forEach((x) => {
          this.listValorTabla.push ({ label: x.valorPrincipal , value: x.id });
      });
    });


  }



  
  public filterTractos(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredTracto = this.tractos.filter((driver) => {
      const placa = driver.placa.toLowerCase();
     // const confveh = driver.confveh.toLowerCase();
      return placa.includes(query);
    });
  }




  public filterDrivers(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredDrivers = this.drivers.filter((driver) => {
      const nombreCompleto = driver.nombreCompleto.toLowerCase();
      const dni = driver.dni.toLowerCase();
      return nombreCompleto.includes(query) || dni.includes(query);
    });
  }

  public filterCarretas(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredCarreta = this.carretas.filter((driver) => {
      const placa = driver.placa.toLowerCase();
      return placa.includes(query) ;
    });
  }

  public onDriverSelect(event: any): void {
    const driverId = event?.id; // Acceder al ID del conductor seleccionado
    this.driverSelected.emit(driverId); // Emitir solo el ID
  }
  public onTractoSelect(event: any): void {
    const driverId = event?.id; // Acceder al ID del conductor seleccionado
    this.driverSelected.emit(driverId); // Emitir solo el ID
  }


  public onCarretaSelect(event: any): void {
    const driverId = event?.id; // Acceder al ID del conductor seleccionado
    this.driverSelected.emit(driverId); // Emitir solo el ID
  }



  public asignarConductor(): void {


  
    this.confirmationService.confirm({
      acceptLabel: 'Guardar',                   // Texto del botón "Aceptar"
      rejectLabel: 'Cancelar',                  // Texto del botón "Rechazar"
      acceptIcon: 'pi pi-check',                // Icono del botón "Aceptar"
      rejectIcon: 'pi pi-times',                // Icono del botón "Rechazar"
      message: '¿Está seguro que desea asignar este vehículo?',
      header: 'Confirmar Guardado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
  




    this.recepcionService.registrarEquipoTransporte( this.id, this.selectedTracto.id
      , this.selectedCarreta?.id, this.selectedDriver.id , this.selectedValorTabla ).subscribe( resp => {


          this.ref.close(true);

      }) ;
  



      } ,
      reject: () => {
      }
      });

  }
}
