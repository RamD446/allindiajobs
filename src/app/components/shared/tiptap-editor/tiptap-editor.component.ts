import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';

const TextStyleAttributes = Extension.create({
  name: 'textStyleAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes['fontSize']) {
                return {};
              }

              return { style: `font-size: ${attributes['fontSize']}` };
            }
          },
          color: {
            default: null,
            parseHTML: (element) => element.style.color || null,
            renderHTML: (attributes) => {
              if (!attributes['color']) {
                return {};
              }

              return { style: `color: ${attributes['color']}` };
            }
          },
          backgroundColor: {
            default: null,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes['backgroundColor']) {
                return {};
              }

              return { style: `background-color: ${attributes['backgroundColor']}` };
            }
          }
        }
      }
    ];
  }
});

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tiptap-editor.component.html',
  styleUrl: './tiptap-editor.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TiptapEditorComponent),
      multi: true
    }
  ]
})
export class TiptapEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() placeholder = 'Type here...';

  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  editor: Editor | null = null;
  private value = '';
  selectedFontSize = '16px';
  selectedTextColor = '';
  selectedHighlightColor = '';
  readonly fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px'];
  readonly textColors = [
    { label: 'Text color', value: '' },
    { label: 'Black', value: '#111827' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Red', value: '#dc2626' },
    { label: 'Green', value: '#15803d' },
    { label: 'Gray', value: '#475569' }
  ];
  readonly highlightColors = [
    { label: 'Highlight', value: '' },
    { label: 'Yellow', value: '#fde68a' },
    { label: 'Cyan', value: '#bae6fd' },
    { label: 'Pink', value: '#fecdd3' },
    { label: 'Mint', value: '#bbf7d0' }
  ];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorHost.nativeElement,
      extensions: [
        StarterKit,
        Underline,
        Link.configure({
          autolink: true,
          openOnClick: true,
          defaultProtocol: 'https'
        }),
        Image,
        TextStyle,
        TextStyleAttributes,
        TextAlign.configure({
          types: ['heading', 'paragraph']
        }),
        Placeholder.configure({
          placeholder: this.placeholder
        })
      ],
      content: this.value || '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.value = html;
        this.selectedFontSize = this.getActiveFontSize();
        this.selectedTextColor = this.getActiveTextColor();
        this.selectedHighlightColor = this.getActiveBackgroundColor();
        this.onChange(html);
      },
      onBlur: () => {
        this.onTouched();
      }
    });

    this.selectedFontSize = this.getActiveFontSize();
  }

  writeValue(value: string | null): void {
    this.value = value || '';

    if (this.editor) {
      this.editor.commands.setContent(this.value || '', { emitUpdate: false });
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.editor) {
      this.editor.setEditable(!isDisabled);
    }
  }

  setParagraph(): void {
    this.editor?.chain().focus().setParagraph().run();
  }

  toggleHeading(level: 1 | 2 | 3): void {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  setTextAlign(align: 'left' | 'center' | 'right'): void {
    this.editor?.chain().focus().setTextAlign(align).run();
  }

  setFontSize(size: string): void {
    this.selectedFontSize = size;
    this.editor?.chain().focus().setMark('textStyle', { fontSize: size }).run();
  }

  setTextColor(color: string): void {
    this.selectedTextColor = color;
    this.editor?.chain().focus().setMark('textStyle', { color: color || null }).run();
  }

  setHighlightColor(color: string): void {
    this.selectedHighlightColor = color;
    this.editor?.chain().focus().setMark('textStyle', { backgroundColor: color || null }).run();
  }

  addLink(): void {
    const currentHref = this.editor?.getAttributes('link')['href'] || '';
    const url = window.prompt('Enter link URL', currentHref);

    if (url === null) {
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      this.editor?.chain().focus().unsetLink().run();
      return;
    }

    this.editor?.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }

  addImage(): void {
    const url = window.prompt('Enter image URL');
    if (!url) {
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }

    this.editor?.chain().focus().setImage({ src: trimmed }).run();
  }

  undo(): void {
    this.editor?.chain().focus().undo().run();
  }

  redo(): void {
    this.editor?.chain().focus().redo().run();
  }

  clearFormatting(): void {
    this.editor?.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run();
  }

  isBoldActive(): boolean {
    return !!this.editor?.isActive('bold');
  }

  isItalicActive(): boolean {
    return !!this.editor?.isActive('italic');
  }

  isUnderlineActive(): boolean {
    return !!this.editor?.isActive('underline');
  }

  isStrikeActive(): boolean {
    return !!this.editor?.isActive('strike');
  }

  isBulletListActive(): boolean {
    return !!this.editor?.isActive('bulletList');
  }

  isOrderedListActive(): boolean {
    return !!this.editor?.isActive('orderedList');
  }

  isBlockquoteActive(): boolean {
    return !!this.editor?.isActive('blockquote');
  }

  isHeadingActive(level: 1 | 2 | 3): boolean {
    return !!this.editor?.isActive('heading', { level });
  }

  isParagraphActive(): boolean {
    return !!this.editor?.isActive('paragraph');
  }

  isLinkActive(): boolean {
    return !!this.editor?.isActive('link');
  }

  isTextAlignActive(align: 'left' | 'center' | 'right'): boolean {
    return !!this.editor?.isActive({ textAlign: align });
  }

  private getActiveFontSize(): string {
    const size = this.editor?.getAttributes('textStyle')['fontSize'];
    return size || '16px';
  }

  private getActiveTextColor(): string {
    return this.editor?.getAttributes('textStyle')['color'] || '';
  }

  private getActiveBackgroundColor(): string {
    return this.editor?.getAttributes('textStyle')['backgroundColor'] || '';
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
