import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Pagina, RolPagina } from 'app/modules/admin/_models/rol';
import { RolService } from 'app/modules/admin/_services/rol.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-vincular-pantallas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './vincular-pantallas.component.html',
})
export class VincularPantallasComponent implements OnInit {
  private rolService     = inject(RolService);
  private messageService = inject(MessageService);
  private ref            = inject(DynamicDialogRef);
  private config         = inject(DynamicDialogConfig);

  rolId!: number;
  rolDescripcion = '';

  cargando = false;
  guardando = false;

  paginas: Pagina[] = [];
  treeNodes: TreeNode[] = [];
  selectedNodes: TreeNode[] = [];
  filtro = '';
  filtered: TreeNode[] = [];

  ngOnInit(): void {
    this.rolId = this.config.data?.rolId;
    this.rolDescripcion = this.config.data?.rolDescripcion ?? '';
    this.cargar();
  }

  cargar(): void {
    if (!this.rolId) return;
    this.cargando = true;

    forkJoin({
      paginas: this.rolService.getPaginas(),
      asignadas: this.rolService.getPaginasByRol(this.rolId),
    }).subscribe({
      next: ({ paginas, asignadas }) => {
        this.paginas = paginas ?? [];
        const idsAsignadas = new Set((asignadas ?? []).map(a => a.idPagina));
        this.treeNodes = this.buildTree(this.paginas);
        this.selectedNodes = this.markSelected(this.treeNodes, idsAsignadas);
        this.filtered = [...this.treeNodes];
      },
      error: (err) => {
        console.error('Error cargando páginas', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las páginas.',
        });
      },
      complete: () => (this.cargando = false),
    });
  }

  /** Construye el árbol agrupando páginas por CodigoPadre. Garantiza que toda página aparezca. */
  private buildTree(paginas: Pagina[]): TreeNode[] {
    const byCodigo = new Map<string, Pagina>();
    paginas.forEach(p => byCodigo.set(p.codigo, p));

    // Agrupa hijos por CodigoPadre
    const hijosPorPadre = new Map<string, Pagina[]>();
    for (const p of paginas) {
      const key = (p.codigoPadre || '').trim();
      if (!hijosPorPadre.has(key)) hijosPorPadre.set(key, []);
      hijosPorPadre.get(key)!.push(p);
    }

    const ordenar = (lista: Pagina[]) =>
      [...lista].sort(
        (a, b) =>
          (a.orden ?? 0) - (b.orden ?? 0) ||
          (a.descripcion ?? '').localeCompare(b.descripcion ?? '')
      );

    const buildNode = (p: Pagina, esRaiz: boolean): TreeNode => {
      const hijos = ordenar(hijosPorPadre.get(p.codigo) ?? []).filter(h => h.id !== p.id);
      const node: TreeNode = {
        key: `p-${p.id}`,
        label: esRaiz ? (p.descripcion?.toUpperCase() || p.codigo) : (p.descripcion || p.codigo),
        data: p,
        expanded: true,
        children: hijos.map(h => buildNode(h, false)),
      };
      if (node.children!.length === 0) delete node.children;
      return node;
    };

    // Raíces (grupos):
    //  1) Páginas sin CodigoPadre (CITAS, etc.)
    //  2) Páginas auto-referenciadas — Codigo == CodigoPadre (convención del sistema:
    //     SEGURIDAD MN001/MN001, MANTENIMIENTO MN016/MN016, etc.)
    //  3) Páginas con CodigoPadre huérfano (no apunta a ninguna otra página existente)
    const raices = paginas.filter(p => {
      const padre = (p.codigoPadre || '').trim();
      if (!padre) return true;
      if (padre === p.codigo) return true;
      return !byCodigo.has(padre);
    });

    return ordenar(raices).map(p => buildNode(p, true));
  }

  /** Marca como seleccionados los nodos cuya página esté en el set. */
  private markSelected(nodes: TreeNode[], idsAsignadas: Set<number>): TreeNode[] {
    const selected: TreeNode[] = [];
    const visit = (n: TreeNode) => {
      const id = (n.data as Pagina)?.id;
      if (id && idsAsignadas.has(id)) selected.push(n);
      n.children?.forEach(visit);
    };
    nodes.forEach(visit);
    return selected;
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      const all: TreeNode[] = [];
      const visit = (n: TreeNode) => { all.push(n); n.children?.forEach(visit); };
      this.treeNodes.forEach(visit);
      this.selectedNodes = all;
    } else {
      this.selectedNodes = [];
    }
  }

  get allChecked(): boolean {
    const totalNodos = this.contarNodos(this.treeNodes);
    return totalNodos > 0 && this.selectedNodes.length >= totalNodos;
  }

  private contarNodos(nodes: TreeNode[]): number {
    let n = 0;
    const visit = (node: TreeNode) => { n++; node.children?.forEach(visit); };
    nodes.forEach(visit);
    return n;
  }

  aplicarFiltro(): void {
    const q = this.filtro?.trim().toLowerCase() ?? '';
    if (!q) {
      this.filtered = [...this.treeNodes];
      return;
    }

    const result: TreeNode[] = [];
    for (const padre of this.treeNodes) {
      const padreCoincide = (padre.label ?? '').toLowerCase().includes(q);
      const hijos = (padre.children ?? []).filter(h =>
        (h.label ?? '').toLowerCase().includes(q)
      );
      if (padreCoincide || hijos.length > 0) {
        result.push({ ...padre, expanded: true, children: padreCoincide ? padre.children : hijos });
      }
    }
    this.filtered = result;
  }

  cancelar(): void {
    this.ref.close(null);
  }

  guardar(): void {
    if (!this.rolId) return;
    this.guardando = true;

    const seleccion: RolPagina[] = (this.selectedNodes ?? [])
      .filter(n => !!(n.data as Pagina)?.id)
      .map(n => ({
        idRol: this.rolId,
        idPagina: (n.data as Pagina).id,
        permisos: 'AME',
      }));

    this.rolService.saveRolPaginas(this.rolId, seleccion).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'TWH',
          detail: 'Páginas vinculadas al rol correctamente.',
        });
        setTimeout(() => this.ref.close({ ok: true }), 400);
      },
      error: (err) => {
        console.error('Error guardando vínculos', err);
        const msg = err?.error?.message ?? 'No se pudieron guardar los vínculos.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
      complete: () => (this.guardando = false),
    });
  }

  /** Etiquetas de los nodos seleccionados (para preview "Menu Seleccionado"). */
  get seleccionLabels(): string[] {
    return (this.selectedNodes ?? [])
      .map(n => (n.data as Pagina)?.descripcion)
      .filter((x): x is string => !!x)
      .sort();
  }
}
