import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';

// ✅ Servicios
import { AlmacenService } from '../../_services/almacen.service';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { RecepcionService } from '../recepcion.service';

// ✅ PrimeNG + Material Imports
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MatIcon } from '@angular/material/icon';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TableModule,
    DialogModule,
    DynamicDialogModule,
    ToastModule,
    CalendarModule,
    ConfirmDialogModule,
    MatIcon,
    IconFieldModule,
    InputIconModule,
    InputMaskModule,
    InputNumberModule,
    PanelModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class EditComponent implements OnInit {
  form: FormGroup;
  loading = false;

  propietarios: SelectItem[] = [];
  tiposingreso: SelectItem[] = [];
  almacenes: SelectItem[] = [];
  destinos: SelectItem[] = [];
  tipodescarga: SelectItem[] = [];

  agregados: any[] = [];
  model: any = {};

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  id!: number;

  // Calendario en español
  es = {
    firstDayOfWeek: 1,
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy',
    clear: 'Borrar'
  };

  constructor(
    private ref: DynamicDialogRef,
    public dialogService: DialogService,
    private almacenService: AlmacenService,
    
    private propietarioService: PropietarioService,
    private confirmationService: ConfirmationService,
    private generalService: GeneralService,
    private recepcionService: RecepcionService,
    private messageService: MessageService,
    private fb: FormBuilder,
    public config: DynamicDialogConfig,
    private router: Router
  ) {
    this.form = this.fb.group({
      almacenId: [null, Validators.required],
      propietarioId: [null, Validators.required],
      fechaEsperada: [new Date(), Validators.required],
      horaEsperada: ['15:00', Validators.required],
      IdTipoIngreso: [null, Validators.required],
      destino: [null],
      ordenCompra: ['', [Validators.minLength(5), Validators.maxLength(20), Validators.required]],
      guiaRemision: ['', [Validators.minLength(5), Validators.maxLength(50), Validators.required]],
      cantidad: [null, [Validators.min(1), Validators.max(100000)]],
      peso: [null, [Validators.min(0.01), Validators.max(100000)]],
      volumen: [null, [Validators.min(0.01), Validators.max(100000)]],
      proveedor: ['', [Validators.minLength(5), Validators.maxLength(50)]],
      entrega: ['', [Validators.minLength(5), Validators.maxLength(50)]]
    });

    this.id = this.config.data.id;
  }

  // ===============================================================
  // 🔹 CARGA INICIAL ORDENADA
  // ===============================================================
  ngOnInit() {
    const token = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(token ?? '');

    this.model.horaEsperada = '15:00';

    // Esperar a que los combos terminen de cargar antes de aplicar valores
    forkJoin([
      this.propietarioService.getAllPropietarios(),
      this.almacenService.getAllAlmacenes(),
      this.generalService.getValorTabla(31),
      this.generalService.getValorTabla(31)
    ]).subscribe(([propResp, almacResp, tipoIngResp, tipoDescResp]) => {
      this.propietarios = propResp.map((p: any) => ({ value: p.id, label: p.razonSocial }));
      this.almacenes = almacResp.map((a: any) => ({ value: a.id, label: a.descripcion }));
      this.tiposingreso = tipoIngResp.map((t: any) => ({ value: t.id, label: t.valorPrincipal }));
      this.tipodescarga = tipoDescResp.map((t: any) => ({ value: t.id, label: t.valorPrincipal }));

      // ✅ Una vez que todo esté cargado, obtenemos la orden
      this.cargarOrden();
    });
  }

  // ===============================================================
  // 🔹 OBTENER Y CARGAR ORDEN EN EL FORMULARIO
  // ===============================================================
  cargarOrden() {
    this.recepcionService.obtenerOrden(this.id).subscribe(resp => {
      this.model = resp;

      // Convertir la fecha
      if (this.model.fechaEsperada) {
        this.model.fechaEsperada = new Date(this.model.fechaEsperada);
      }

      // Convertir hora "HH:mm:ss" a "HH:mm"
      let horaFormateada: string | null = null;
      if (this.model.horaEsperada) {
        const partes = this.model.horaEsperada.split(':');
        if (partes.length >= 2) {
          horaFormateada = `${partes[0]}:${partes[1]}`;
        }
      }

      // Asignar valores al formulario
      this.form.patchValue({
        almacenId: this.model.almacenID,
        propietarioId: this.model.propietarioID,
        fechaEsperada: this.model.fechaEsperada,
        horaEsperada: horaFormateada,
        IdTipoIngreso: this.model.tipoIngresoId,
        destino: this.model.destino,
        ordenCompra: this.model.oc,
        guiaRemision: this.model.guiaRemision,
        cantidad: this.model.cantidad ?? null,
        peso: this.model.peso ?? null,
        volumen: this.model.volumen ?? null,
        proveedor: this.model.proveedor,
        entrega: this.model.numeroEntrega
      });
    });
  }

  // ===============================================================
  // 🔹 GUARDAR CAMBIOS
  // ===============================================================
  registrar() {
    if (this.form.invalid) return;

    this.confirmationService.confirm({
      message: '¿Está seguro que desea editar la ORI?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const v = this.form.value;

        const model: any = {
          almacenId: v.almacenId,
          propietario: this.propietarios.find(x => x.value === v.propietarioId)?.label ?? null,
          propietarioId: v.propietarioId,
          fechaEsperada: v.fechaEsperada,
          horaEsperada: v.horaEsperada,
          tipoIngresoId: v.IdTipoIngreso,
          destino: v.destino,
          oc: v.ordenCompra,
          ordenCompra: v.ordenCompra,
          guiaRemision: v.guiaRemision,
          GuiaRemision: v.guiaRemision,
          cantidad: v.cantidad,
          peso: v.peso,
          volumen: v.volumen,
          proveedor: v.proveedor,
          entrega: v.entrega,
          usuarioId: this.decodedToken.nameid,
          id: this.id
        };

        this.recepcionService
          .actualizar(model)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: resp => this.ref.close({ ok: true, data: resp }),
            error: err =>
              this.ref.close({
                ok: false,
                error: err?.error?.message || 'No se pudo registrar la ORI.'
              })
          });
      }
    });
  }

  // ===============================================================
  // 🔹 CAMBIO DE PROPIETARIO → DESTINOS
  // ===============================================================
  onChangePropietario(propietario: any) {
    this.destinos = [];

    this.recepcionService.getAllDestinosPalmas(propietario.value).subscribe(resp => {
      this.destinos = resp.map((element: any) => ({
        value: element.id,
        label: element.razonSocial
      }));

      if (this.destinos.length === 1) {
        const unico = this.destinos[0];
        this.form.get('clienteId')?.setValue(unico.value);
      }
    });
  }

  // ===============================================================
  // 🔹 ELIMINAR ORDEN
  // ===============================================================
  deleteOrder(id: number) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el despacho?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.recepcionService.deleteOrder(id).subscribe(() => {
          const index = this.agregados.findIndex(item => item.id === id);
          if (index !== -1) this.agregados.splice(index, 1);

          this.messageService.add({
            severity: 'success',
            summary: 'TWH',
            detail: 'Se eliminó correctamente.'
          });
        });
      }
    });
  }
}
