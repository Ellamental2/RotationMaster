import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TitleCasePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Ability } from '../../models';
import { allAbilitiesCatalog, searchAbilities } from '../../abilitiesLookup';

let openDropdown: SearchDropdown | null = null;

@Component({
    selector: 'rm-search-dropdown',
    templateUrl: './search-dropdown.html',
    styleUrls: ['./search-dropdown.scss'],
    imports: [TitleCasePipe, NgClass, FormsModule, ScrollingModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class SearchDropdown implements OnChanges, OnDestroy {
  list: Ability[] = [];
  keyword = "";
  readonly itemSize = 20;
  @Output() afterChange = new EventEmitter<Ability>();
  @ViewChild("input") input?: ElementRef<HTMLInputElement>;
  @Input() items: Ability[] = [];
  @Input() selectedAbility: Ability | null = null;
  value: string = "Select Ability";
  shown = false;
  private readonly titleCasePipe = new TitleCasePipe();

  private readonly onDocumentClick = (e: MouseEvent) => {
    if (!this.ele.nativeElement.contains(e.target as Node)) {
      this.close();
    }
  };

  constructor(private ele: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedAbility']) {
      this.value = this.selectedAbility ? this.selectedAbility.Emoji : 'Select Ability';
    }
  }

  trackByAbility = (_index: number, item: Ability) => item.Title || item.Emoji;

  search(e: string) {
    this.list = searchAbilities(e, this.catalog);
    this.cdr.markForCheck();
  }

  select(item: Ability) {
    this.selectedAbility = item;
    this.value = this.selectedAbility ? this.selectedAbility.Emoji : 'Select Ability';
    this.afterChange.emit(item);
    this.close();
  }

  show() {
    if (this.shown) {
      this.close();
      return;
    }

    if (openDropdown && openDropdown !== this) {
      openDropdown.close();
    }

    this.keyword = this.selectedAbility?.Emoji
      ? this.titleCasePipe.transform(this.selectedAbility.Emoji)
      : '';
    this.list = this.keyword ? searchAbilities(this.keyword, this.catalog) : this.catalog;
    this.shown = true;
    openDropdown = this;
    document.addEventListener('mousedown', this.onDocumentClick);
    this.cdr.markForCheck();

    setTimeout(() => {
      const input = this.input?.nativeElement;
      if (!input) {
        return;
      }
      input.focus();
      if (this.keyword) {
        input.select();
      }
    }, 0);
  }

  close() {
    if (!this.shown) {
      return;
    }

    this.shown = false;
    this.list = [];
    this.keyword = '';
    if (openDropdown === this) {
      openDropdown = null;
    }
    document.removeEventListener('mousedown', this.onDocumentClick);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.onDocumentClick);
    if (openDropdown === this) {
      openDropdown = null;
    }
  }

  private get catalog(): Ability[] {
    return this.items?.length ? this.items : allAbilitiesCatalog;
  }
}
