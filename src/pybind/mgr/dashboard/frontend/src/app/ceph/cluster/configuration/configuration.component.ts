import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { I18n } from '@ngx-translate/i18n-polyfill';

import { ConfigurationService } from '../../../shared/api/configuration.service';
import { ActionLabelsI18n } from '../../../shared/constants/app.constants';
import { CellTemplate } from '../../../shared/enum/cell-template.enum';
import { Icons } from '../../../shared/enum/icons.enum';
import { CdTableAction } from '../../../shared/models/cd-table-action';
import { CdTableColumn } from '../../../shared/models/cd-table-column';
import { CdTableFetchDataContext } from '../../../shared/models/cd-table-fetch-data-context';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import { Permission } from '../../../shared/models/permissions';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';

@Component({
  selector: 'cd-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  permission: Permission;
  tableActions: CdTableAction[];
  data = [];
  icons = Icons;
  columns: CdTableColumn[];
  selection = new CdTableSelection();
  filters: CdTableColumn[] = [
    {
      name: this.i18n('Level'),
      prop: 'level',
      filterOptions: ['basic', 'advanced', 'dev'],
      filterInitValue: 'basic',
      filterPredicate: (row, value) => {
        enum Level {
          basic = 0,
          advanced = 1,
          dev = 2
        }

        const levelVal = Level[value];

        return Level[row.level] <= levelVal;
      }
    },
    {
      name: this.i18n('Service'),
      prop: 'services',
      filterOptions: ['mon', 'mgr', 'osd', 'mds', 'common', 'mds_client', 'rgw'],
      filterPredicate: (row, value) => {
        return row.services.includes(value);
      }
    },
    {
      name: this.i18n('Source'),
      prop: 'source',
      filterOptions: ['mon'],
      filterPredicate: (row, value) => {
        if (!row.hasOwnProperty('source')) {
          return false;
        }
        return row.source.includes(value);
      }
    },
    {
      name: this.i18n('Modified'),
      prop: 'modified',
      filterOptions: ['yes', 'no'],
      filterPredicate: (row, value) => {
        if (value === 'yes' && row.hasOwnProperty('value')) {
          return true;
        }

        if (value === 'no' && !row.hasOwnProperty('value')) {
          return true;
        }

        return false;
      }
    }
  ];

  @ViewChild('confValTpl', { static: true })
  public confValTpl: TemplateRef<any>;
  @ViewChild('confFlagTpl', { static: false })
  public confFlagTpl: TemplateRef<any>;

  constructor(
    private authStorageService: AuthStorageService,
    private configurationService: ConfigurationService,
    private i18n: I18n,
    public actionLabels: ActionLabelsI18n
  ) {
    this.permission = this.authStorageService.getPermissions().configOpt;
    const getConfigOptUri = () =>
      this.selection.first() && `${encodeURIComponent(this.selection.first().name)}`;
    const editAction: CdTableAction = {
      permission: 'update',
      icon: Icons.edit,
      routerLink: () => `/configuration/edit/${getConfigOptUri()}`,
      name: this.actionLabels.EDIT,
      disable: () => !this.isEditable(this.selection)
    };
    this.tableActions = [editAction];
  }

  ngOnInit() {
    this.columns = [
      { canAutoResize: true, prop: 'name', name: this.i18n('Name') },
      { prop: 'desc', name: this.i18n('Description'), cellClass: 'wrap' },
      {
        prop: 'value',
        name: this.i18n('Current value'),
        cellClass: 'wrap',
        cellTemplate: this.confValTpl
      },
      { prop: 'default', name: this.i18n('Default'), cellClass: 'wrap' },
      {
        prop: 'can_update_at_runtime',
        name: this.i18n('Editable'),
        cellTransformation: CellTemplate.checkIcon,
        flexGrow: 0.4,
        cellClass: 'text-center'
      }
    ];
  }

  updateSelection(selection: CdTableSelection) {
    this.selection = selection;
  }

  getConfigurationList(context: CdTableFetchDataContext) {
    this.configurationService.getConfigData().subscribe(
      (data: any) => {
        this.data = data;
      },
      () => {
        context.error();
      }
    );
  }

  isEditable(selection: CdTableSelection): boolean {
    if (selection.selected.length !== 1) {
      return false;
    }

    return selection.selected[0].can_update_at_runtime;
  }
}
