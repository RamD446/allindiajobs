import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule],
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

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorHost.nativeElement,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: this.placeholder
        })
      ],
      content: this.value || '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.value = html;
        this.onChange(html);
      },
      onBlur: () => {
        this.onTouched();
      }
    });
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

  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  clearFormatting(): void {
    this.editor?.chain().focus().unsetAllMarks().clearNodes().run();
  }

  isBoldActive(): boolean {
    return !!this.editor?.isActive('bold');
  }

  isBulletListActive(): boolean {
    return !!this.editor?.isActive('bulletList');
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
