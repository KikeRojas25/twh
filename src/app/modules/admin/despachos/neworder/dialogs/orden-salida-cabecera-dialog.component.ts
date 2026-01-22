import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DespachosService } from '../../despachos.service';
import { PropietarioService } from '../../../_services/propietario.service';
import { ClienteService } from '../../../_services/cliente.service';
import { GeneralService } from '../../../_services/general.service';
import { buildOrdenSalidaCabeceraPayload } from '../neworder.mapper';

type CabeceraDialogMode = 'create' | 'edit';

@Component({
  selector: 'app-orden-salida-cabecera-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './orden-salida-cabecera-dialog.component.html'
})
export class OrdenSalidaCabeceraDialogComponent implements OnInit {
  form: FormGroup;

  propietarios: SelectItem[] = [];
  almacenes: SelectItem[] = [];
  clientes: SelectItem[] = [];
  direcciones: SelectItem[] = [];
  tiposDescarga: SelectItem[] = [];

  loading = false;
  mode: CabeceraDialogMode = 'create';
  ordenSalidaId: number | null = null;
  private isPrefilling = false;
  jwtHelper = new JwtHelperService();
  decodedToken: any = {};

  constructor(
    private fb: FormBuilder,
    private despachosService: DespachosService,
    private propietarioService: PropietarioService,
    private clienteService: ClienteService,
    private generalService: GeneralService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.form = this.fb.group({
      almacenId: [null],
      propietarioId: [null, Validators.required],
      ordenCompraCliente: ['', Validators.required],
      fechaRequerida: [new Date(), Validators.required],
      horaRequerida: [new Date(), Validators.required],
      clienteId: [null, Validators.required],
      direccionId: [null, Validators.required],
      guiaRemision: [''],
      ordenEntrega: [''],
      ordenInfor: [''],
      tipoDescargaId: [null]
    });
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    this.decodedToken = token ? this.jwtHelper.decodeToken(token) : {};

    const data = (this.config?.data ?? {}) as any;
    this.mode = (data?.mode as CabeceraDialogMode) || 'create';
    this.ordenSalidaId = data?.ordenSalidaId ? Number(data.ordenSalidaId) : null;

    // En edición: bloquear almacén y propietario (no deben ser modificables)
    if (this.mode === 'edit') {
      this.form.get('almacenId')?.disable({ emitEvent: false });
      this.form.get('propietarioId')?.disable({ emitEvent: false });
    }

    // Prefill desde lista (solo modo create)
    if (this.mode === 'create') {
      const prefill = data as { propietarioId?: number; almacenId?: number };
      if (prefill?.propietarioId) {
        this.form.patchValue({ propietarioId: prefill.propietarioId });
      }
      if (prefill?.almacenId) {
        this.form.patchValue({ almacenId: prefill.almacenId });
      }
    }

    this.propietarioService.getAllPropietarios().subscribe({
      next: (resp) => {
        this.propietarios = (resp ?? []).map((x: any) => ({ value: x.id, label: x.razonSocial }));
      },
      error: (err) => console.error('Error al cargar propietarios:', err)
    });

    this.generalService.getAllAlmacenes().subscribe({
      next: (resp) => {
        this.almacenes = (resp ?? []).map((a: any) => ({ value: a.id, label: a.descripcion }));
      },
      error: (err) => console.error('Error al cargar almacenes:', err)
    });

    this.generalService.getValorTabla(43).subscribe({
      next: (resp) => {
        this.tiposDescarga = (resp ?? []).map((x: any) => ({ value: x.id, label: x.valorPrincipal }));
      },
      error: (err) => console.error('Error al cargar tipos de descarga:', err)
    });

    this.form.get('propietarioId')?.valueChanges.subscribe((propietarioId) => {
      if (propietarioId) {
        this.onChangePropietario(propietarioId);
      } else {
        this.clientes = [];
        this.direcciones = [];
        this.form.patchValue({ clienteId: null, direccionId: null }, { emitEvent: false });
      }
    });

    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      if (clienteId) {
        this.onChangeCliente(clienteId);
      } else {
        this.direcciones = [];
        this.form.patchValue({ direccionId: null }, { emitEvent: false });
      }
    });

    // Si estamos editando, cargar por ID
    if (this.mode === 'edit' && this.ordenSalidaId) {
      this.cargarCabeceraExistente(this.ordenSalidaId);
      return;
    }

    // Si ya venía prefill de propietario (create), disparar carga clientes
    const propietarioId = this.form.get('propietarioId')?.value;
    if (propietarioId) {
      this.onChangePropietario(propietarioId);
    }
  }

  onChangePropietario(propietarioId: number): void {
    this.clientes = [];
    this.direcciones = [];
    if (!this.isPrefilling) {
      this.form.patchValue({ clienteId: null, direccionId: null }, { emitEvent: false });
    }

    this.clienteService.getAllClientesxPropietarios(propietarioId).subscribe({
      next: (resp) => {
        this.clientes = (resp ?? []).map((c: any) => ({ value: c.id, label: c.razonSocial }));
        if (this.clientes.length === 1 && !this.isPrefilling) {
          this.form.get('clienteId')?.setValue(this.clientes[0].value);
        }
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  onChangeCliente(clienteId: number): void {
    this.direcciones = [];
    if (!this.isPrefilling) {
      this.form.patchValue({ direccionId: null }, { emitEvent: false });
    }

    this.clienteService.getAllDirecciones(clienteId).subscribe({
      next: (resp) => {
        this.direcciones = (resp ?? []).map((d: any) => ({
          value: d.iddireccion,
          label: `${d.direccion} [ ${d.departamento} - ${d.provincia} - ${d.distrito} ]`
        }));
        if (this.direcciones.length === 1 && !this.isPrefilling) {
          this.form.get('direccionId')?.setValue(this.direcciones[0].value);
        }
      },
      error: (err) => console.error('Error al cargar direcciones:', err)
    });
  }

  cancelar(): void {
    this.ref.close(null);
  }

  guardarYContinuar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos.' });
      return;
    }

    const usuarioId = Number(this.decodedToken?.nameid);
    // En modo edición usamos getRawValue() para incluir controles deshabilitados (almacenId/clienteId)
    const formValue = this.mode === 'edit' ? this.form.getRawValue() : this.form.value;
    const propietarioLabel = this.propietarios.find((x) => x.value === formValue.propietarioId)?.label || null;
    const payload = buildOrdenSalidaCabeceraPayload({
      formValue,
      propietarioLabel,
      usuarioId
    });

    this.confirmationService.confirm({
      header: 'Confirmar',
      message: this.mode === 'edit'
        ? '¿Desea guardar los cambios de cabecera?'
        : '¿Desea guardar la cabecera y continuar con el detalle?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.mode === 'edit' ? 'Sí, guardar' : 'Sí, continuar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.loading = true;
        if (this.mode === 'edit' && this.ordenSalidaId) {
          const updatePayload = { ...payload, Id: this.ordenSalidaId, Items: 0, Detalles: [] };
          this.despachosService.actualizarOrdenSalida(updatePayload).subscribe({
            next: () => {
              this.loading = false;
              this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Cabecera actualizada.' });
              this.ref.close({ success: true });
            },
            error: (err) => {
              this.loading = false;
              console.error(err);
              const mensajeError = err?.error?.message || 'No se pudo actualizar la cabecera.';
              this.messageService.add({ severity: 'error', summary: 'Error', detail: mensajeError });
            }
          });
          return;
        }

        this.despachosService.RegistarOrdenSalida(payload).subscribe({
          next: (resp: any) => {
            const ordenSalidaId = this.extractOrdenSalidaId(resp);
            this.loading = false;
            if (!ordenSalidaId) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo obtener el ID de la orden creada.'
              });
              return;
            }
            this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'Cabecera guardada.' });
            this.ref.close({ ordenSalidaId, cabeceraPayload: payload });
          },
          error: (err) => {
            this.loading = false;
            console.error(err);
            const mensajeError = err?.error?.message || 'No se pudo guardar la cabecera.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: mensajeError });
          }
        });
      }
    });
  }

  private extractOrdenSalidaId(resp: any): number | null {
    if (typeof resp === 'number') return resp;
    const id = resp?.ordenSalidaId ?? resp?.id ?? resp?.data?.ordenSalidaId ?? resp?.data?.id;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private cargarCabeceraExistente(id: number): void {
    this.isPrefilling = true;
    this.loading = true;

    this.despachosService.obtenerOrdenSalidaPorId(id).subscribe({
      next: (orden: any) => {
        const getValue = (camelKey: string, pascalKey: string, defaultValue: any = null) => {
          return orden?.[camelKey] !== undefined ? orden[camelKey] : (orden?.[pascalKey] !== undefined ? orden[pascalKey] : defaultValue);
        };

        // Hora requerida: puede venir "HH:mm" / "HH:mm:ss"
        let horaRequeridaDate: Date | null = null;
        const horaRequeridaValue = getValue('horaRequerida', 'HoraRequerida');
        if (horaRequeridaValue) {
          const partes = String(horaRequeridaValue).split(':');
          if (partes.length >= 2) {
            const fecha = new Date();
            fecha.setHours(parseInt(partes[0], 10), parseInt(partes[1], 10), 0);
            horaRequeridaDate = fecha;
          }
        }

        const propietarioId = getValue('propietarioId', 'PropietarioId');
        const clienteId = getValue('clienteId', 'ClienteId');
        const direccionId = getValue('direccionId', 'DireccionId');

        this.form.patchValue(
          {
            almacenId: getValue('almacenId', 'AlmacenId') || null,
            propietarioId: propietarioId || null,
            ordenCompraCliente: getValue('ordenCompraCliente', 'OrdenCompraCliente', '') || '',
            fechaRequerida: getValue('fechaRequerida', 'FechaRequerida') ? new Date(getValue('fechaRequerida', 'FechaRequerida')) : new Date(),
            horaRequerida: horaRequeridaDate || new Date(),
            guiaRemision: getValue('guiaRemision', 'GuiaRemision', '') || '',
            ordenEntrega: getValue('ordenentrega', 'Ordenentrega', '') || '',
            ordenInfor: getValue('ordeninfor', 'Ordeninfor', '') || '',
            tipoDescargaId: getValue('tipodescargaid', 'Tipodescargaid') || null,
            clienteId: clienteId || null,
            direccionId: direccionId || null
          },
          { emitEvent: false }
        );

        // Cargar clientes y direcciones para que los dropdown muestren label correcto
        if (propietarioId) {
          this.clienteService.getAllClientesxPropietarios(propietarioId).subscribe({
            next: (resp) => {
              this.clientes = (resp ?? []).map((c: any) => ({ value: c.id, label: c.razonSocial }));
              if (clienteId) {
                this.clienteService.getAllDirecciones(clienteId).subscribe({
                  next: (respDir) => {
                    this.direcciones = (respDir ?? []).map((d: any) => ({
                      value: d.iddireccion,
                      label: `${d.direccion} [ ${d.departamento} - ${d.provincia} - ${d.distrito} ]`
                    }));
                    this.loading = false;
                    this.isPrefilling = false;
                  },
                  error: () => {
                    this.loading = false;
                    this.isPrefilling = false;
                  }
                });
              } else {
                this.loading = false;
                this.isPrefilling = false;
              }
            },
            error: () => {
              this.loading = false;
              this.isPrefilling = false;
            }
          });
        } else {
          this.loading = false;
          this.isPrefilling = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar orden para edición:', err);
        this.loading = false;
        this.isPrefilling = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la cabecera de la orden.'
        });
      }
    });
  }
}

