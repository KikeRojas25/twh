  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormGroup, FormsModule } from '@angular/forms';
  import { SelectItem, ConfirmationService } from 'primeng/api';
  import { ButtonModule } from 'primeng/button';
  import { DropdownModule } from 'primeng/dropdown';
  import { InputTextModule } from 'primeng/inputtext';
  import { InputSwitchModule } from 'primeng/inputswitch';
  import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
  import { Router } from '@angular/router';
  import { ClienteService } from '../../../_services/cliente.service';
  import { GeneralService } from '../../../_services/general.service';
  import { ProductoService } from '../../../_services/producto.service';
  import { forkJoin } from 'rxjs';
  import { ConfirmDialogModule } from 'primeng/confirmdialog';
  import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PropietarioService } from 'app/modules/admin/_services/propietario.service';


  @Component({
    selector: 'app-newedit',
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      ButtonModule,
      DropdownModule,
      InputTextModule,
      InputSwitchModule,
      ConfirmDialogModule,
      ToastModule
    ],
    providers: [ConfirmationService,MessageService],
    templateUrl: './newedit.component.html',
    styleUrls: ['./newedit.component.scss']   // ✅ corregido (plural)
  })
  export class NeweditComponent implements OnInit {

  model: any = {};
  form: FormGroup;
  clientes: SelectItem[] = [];
  familias: SelectItem[] = [];
  unidadesMedida: SelectItem[] = [];
  canales: SelectItem[] = [];
  codigoExistente: boolean = false;

  // 🔹 Nueva bandera
  isEditMode: boolean = false;

  constructor(
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private ref: DynamicDialogRef,
    private router: Router,
    private config: DynamicDialogConfig,
    private generalService: GeneralService,
    private productoService: ProductoService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarCombosYProducto();

    // 🔹 Detectamos si es edición
    this.isEditMode = !!this.config.data?.productoId;
  }

  cargarCombosYProducto() {
    const propietarios$ = this.propietarioService.getAllPropietarios();
    const familias$ = this.generalService.getValorTabla(13);
    const unidades$ = this.generalService.getValorTabla(12);
    const canales$ = this.productoService.getCanales();

    forkJoin([propietarios$, familias$, unidades$, canales$]).subscribe({
      next: ([propietarios, familias , unidades, canales]) => {
        this.clientes = propietarios.map(p => ({ value: p.id, label: p.razonSocial }));
        this.familias = familias.map(f => ({ value: f.id, label: f.valorPrincipal }));
        this.unidadesMedida = unidades.map(u => ({ value: u.id, label: u.valorPrincipal }));
        this.canales = canales.map(c => ({ value: c.id, label: c.nombre }));

        const clienteIdLocal = localStorage.getItem('searchPro1');
        this.model.clienteId = clienteIdLocal && clienteIdLocal !== 'undefined'
          ? parseInt(clienteIdLocal, 10)
          : 1;

        const productoId = this.config.data?.productoId;
        if (productoId) {
          this.productoService.get(productoId).subscribe((producto) => {
            console.log('Producto recibido:', producto);
            this.model = { ...producto };

            // ✅ Inicializamos Sobredimensionado
            if (!this.model.sobredimensionado || this.model.sobredimensionado < 1) {
              this.model.sobredimensionado = 1;
            }
          });
        } else {
          // ✅ Nuevo producto
          if (!this.model.sobredimensionado || this.model.sobredimensionado < 1) {
            this.model.sobredimensionado = 1;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar combos', err);
      }
    });
  }

save() {
  const esEdicion = !!this.model.id;

  const mensajeConfirmacion = esEdicion
    ? '¿Seguro que desea editar los datos?'
    : '¿Seguro que quiere crear un nuevo producto?';

  this.confirmationService.confirm({
    acceptLabel: 'Sí',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    message: mensajeConfirmacion,
    header: 'Confirmación',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      const request = esEdicion
        ? this.productoService.editarProducto(this.model)
        : this.productoService.registrarProducto(this.model);

      request.subscribe({
        next: () => {
          // ✅ Aquí definimos el mensaje de éxito real
          const mensajeExito = esEdicion
            ? 'Los datos del producto se han actualizado con éxito.'
            : 'El producto se ha creado con éxito.';

          this.ref.close(mensajeExito); // 🔹 Se envía al padre el texto correcto
        },
        error: (err) => {
          console.error('Error al guardar producto', err);
          this.ref.close('error'); // 🔹 Manejamos error aparte
        }
      });
    },
    reject: () => {}
  });
  }

  close() {
    this.ref?.close();
  }

  validarCodigoSKU() {
    const codigo = this.model.codigo?.trim();
    if (!codigo) {
      this.codigoExistente = false;
      return;
    }

    this.productoService.validarSKU(codigo, this.model.id, this.model.clienteId).subscribe({
      next: (existe: boolean) => {
        this.codigoExistente = existe;
        console.log('¿SKU existente?', this.codigoExistente);
      },
      error: () => {
        this.codigoExistente = false;
      }
    });
  }
}

