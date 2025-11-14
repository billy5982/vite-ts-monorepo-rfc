import { foo, bar } from '@test/lib'
import { foo as foo2 } from '@test/lib/foo'
import { bar as bar2 } from '@test/lib/bar'
import _ from 'lodash';

// ag-grid ColDef와 완전히 같지 않아도 되도록 최소 필드만 정의
export interface ColDefLike {
  colId?: string;
  headerName?: string;
  field?: string;
  children?: ColDefLike[];
  // 그 외 필요한 옵션들 자유롭게 추가
  [key: string]: any;
}

export interface ColChangeItem {
  key: keyof ColDefLike;
  from: unknown;
  to: unknown;
}

export interface ColChange {
  colId: string;
  headerName?: string;
  changes: ColChangeItem[];
}

export interface DiffResult {
  updated: ColChange[];
  added: ColChange[];
  removed: ColChange[];
}

/**
 * children 트리를 평탄화해서 colId 기준 map으로 변환
 */
export const flattenColDefs = (
  cols: ColDefLike[],
  map: Record<string, ColDefLike> = {}
): Record<string, ColDefLike> => {
  cols.forEach((col) => {
    if (col.colId) {
      // children 은 구조용이므로 비교 대상에서 제외
      map[col.colId] = _.omit(col, 'children') as ColDefLike;
    }

    if (col.children && col.children.length > 0) {
      flattenColDefs(col.children, map);
    }
  });

  return map;
};


export const diffColDefs = (
  origin: ColDefLike[],
  edited: ColDefLike[]
): DiffResult => {
  const originMap = flattenColDefs(origin);
  const editedMap = flattenColDefs(edited);

  const updated: ColChange[] = [];
  const added: ColChange[] = [];
  const removed: ColChange[] = [];

  // 1) 변경 + 삭제 (origin 기준)
  Object.keys(originMap).forEach((colId) => {
    const originCol = originMap[colId];
    const editedCol = editedMap[colId];

    // 삭제된 컬럼
    if (!editedCol) {
      removed.push({
        colId,
        headerName: originCol.headerName,
        changes: [],
      });
      return;
    }

    // originCol, editedCol의 key 합집합
    const keys = new Set<string>([
      ...Object.keys(originCol),
      ...Object.keys(editedCol),
    ]);

    const changes: ColChangeItem[] = [];

    keys.forEach((key) => {
      if (key === 'colId') return; // 식별자 자체 변경은 무시 (원하면 지우면 됨)

      const before = originCol[key];
      const after = editedCol[key];

      if (!_.isEqual(before, after)) {
        changes.push({ key, from: before, to: after });
      }
    });

    if (changes.length > 0) {
      updated.push({
        colId,
        headerName: originCol.headerName ?? editedCol.headerName,
        changes,
      });
    }
  });

  // 2) 추가된 컬럼 (edited 기준)
  Object.keys(editedMap).forEach((colId) => {
    if (!originMap[colId]) {
      const editedCol = editedMap[colId];

      const keys = Object.keys(editedCol).filter((k) => k !== 'colId');

      const changes: ColChangeItem[] = keys.map((key) => ({
        key,
        from: undefined,
        to: editedCol[key],
      }));

      added.push({
        colId,
        headerName: editedCol.headerName,
        changes,
      });
    }
  });

  return { updated, added, removed };
};
const originColDefs: ColDefLike[] = [
  {
    headerName: 'title',
    field: 'title',
    colId: 'col_title',
  },
  {
    headerName: 'option',
    colId: 'group_option',
    children: [
      {
        headerName: 'a',
        field: 'optionA',
        colId: 'col_option_a',
      },
      {
        headerName: 'b',
        field: 'optionB',
        colId: 'col_option_b',
      },
    ],
  },
  {
    headerName: 'chart',
    field: 'chart',
    colId: 'col_chart',
  },
];

const editedColDefs: ColDefLike[] = [
  {
    field: 'title2', // <- 변경
    headerName: 'title',
    addedOption: 'title',
    colId: 'col_title',
  },
  {
    headerName: 'option',
    colId: 'group_option',
    children: [
      {
        headerName: 'a',
        field: 'optionA',
        colId: 'col_option_a',
      },
      {
        headerName: 'b',
        field: 'optionB',
        colId: 'col_option_b',
      },
    ],
  },
  // chart 제거했다고 가정
];

const diff = diffColDefs(originColDefs, editedColDefs);
console.log('diff :', diff);
