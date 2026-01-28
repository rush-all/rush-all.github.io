import { FileHandler } from './fileHandler.js';
import { HexComparator } from './hexComparator.js';
import { UIController } from './uiController.js';

class HexCompareApp {
    constructor() {
        this.fileHandler = new FileHandler();
        this.hexComparator = new HexComparator();
        this.uiController = new UIController();
        
        this.file1Data = null;
        this.file2Data = null;
        this.comparisonResult = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 文件1上传
        const file1Input = document.getElementById('file1');
        const dropZone1 = document.getElementById('drop-zone-1');
        
        file1Input.addEventListener('change', (e) => this.handleFileSelect(e, 1));
        dropZone1.addEventListener('click', () => file1Input.click());
        dropZone1.addEventListener('dragover', (e) => this.handleDragOver(e, dropZone1));
        dropZone1.addEventListener('dragleave', (e) => this.handleDragLeave(e, dropZone1));
        dropZone1.addEventListener('drop', (e) => this.handleDrop(e, 1, dropZone1));
        
        // 文件2上传
        const file2Input = document.getElementById('file2');
        const dropZone2 = document.getElementById('drop-zone-2');
        
        file2Input.addEventListener('change', (e) => this.handleFileSelect(e, 2));
        dropZone2.addEventListener('click', () => file2Input.click());
        dropZone2.addEventListener('dragover', (e) => this.handleDragOver(e, dropZone2));
        dropZone2.addEventListener('dragleave', (e) => this.handleDragLeave(e, dropZone2));
        dropZone2.addEventListener('drop', (e) => this.handleDrop(e, 2, dropZone2));
        
        // 比较按钮
        document.getElementById('compare-btn').addEventListener('click', () => this.compareFiles());
        
        // 清空按钮
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        
        // 显示过滤按钮
        document.getElementById('show-all-btn').addEventListener('click', () => this.showAll());
        document.getElementById('show-diff-btn').addEventListener('click', () => this.showDiffOnly());
        
        // 导出按钮
        document.getElementById('export-btn').addEventListener('click', () => this.exportReport());
    }
    
    handleDragOver(e, dropZone) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drop-zone-active');
    }
    
    handleDragLeave(e, dropZone) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drop-zone-active');
    }
    
    handleDrop(e, fileNumber, dropZone) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drop-zone-active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0], fileNumber);
        }
    }
    
    handleFileSelect(e, fileNumber) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0], fileNumber);
        }
    }
    
    async processFile(file, fileNumber) {
        try {
            const content = await this.fileHandler.readFile(file);
            const lines = this.fileHandler.parseHexFile(content);
            
            if (fileNumber === 1) {
                this.file1Data = { file, content, lines };
                this.uiController.updateFileInfo(1, file, lines.length);
            } else {
                this.file2Data = { file, content, lines };
                this.uiController.updateFileInfo(2, file, lines.length);
            }
            
            this.updateCompareButton();
        } catch (error) {
            alert(`读取文件失败: ${error.message}`);
        }
    }
    
    updateCompareButton() {
        const compareBtn = document.getElementById('compare-btn');
        if (this.file1Data && this.file2Data) {
            compareBtn.disabled = false;
        } else {
            compareBtn.disabled = true;
        }
    }
    
    compareFiles() {
        if (!this.file1Data || !this.file2Data) {
            alert('请先上传两个文件');
            return;
        }
        
        const compareBtn = document.getElementById('compare-btn');
        const originalText = compareBtn.innerHTML;
        compareBtn.innerHTML = '<span class="loading-spinner"></span> 比较中...';
        compareBtn.disabled = true;
        
        setTimeout(() => {
            try {
                this.comparisonResult = this.hexComparator.compare(
                    this.file1Data.lines,
                    this.file2Data.lines
                );
                
                this.uiController.displayStats(this.comparisonResult.stats);
                this.uiController.displayComparison(this.comparisonResult.lines);
                
                compareBtn.innerHTML = originalText;
                compareBtn.disabled = false;
            } catch (error) {
                alert(`比较失败: ${error.message}`);
                compareBtn.innerHTML = originalText;
                compareBtn.disabled = false;
            }
        }, 100);
    }
    
    showAll() {
        if (this.comparisonResult) {
            this.uiController.displayComparison(this.comparisonResult.lines, false);
        }
    }
    
    showDiffOnly() {
        if (this.comparisonResult) {
            this.uiController.displayComparison(this.comparisonResult.lines, true);
        }
    }
    
    exportReport() {
        if (!this.comparisonResult) {
            alert('请先进行文件比较');
            return;
        }
        
        const report = this.generateReport();
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hex_comparison_report_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    generateReport() {
        const stats = this.comparisonResult.stats;
        let report = '========================================\n';
        report += '         Hex 文件比较报告\n';
        report += '========================================\n\n';
        report += `文件1: ${this.file1Data.file.name}\n`;
        report += `文件2: ${this.file2Data.file.name}\n`;
        report += `比较时间: ${new Date().toLocaleString()}\n\n`;
        report += '----------------------------------------\n';
        report += '统计信息\n';
        report += '----------------------------------------\n';
        report += `相同行数: ${stats.same}\n`;
        report += `差异行数: ${stats.different}\n`;
        report += `新增行数: ${stats.added}\n`;
        report += `删除行数: ${stats.removed}\n`;
        report += `总行数: ${stats.total}\n`;
        report += `相似度: ${stats.similarity}%\n\n`;
        report += '----------------------------------------\n';
        report += '详细差异\n';
        report += '----------------------------------------\n\n';
        
        this.comparisonResult.lines.forEach(line => {
            if (line.type !== 'same') {
                report += `行 ${line.lineNumber}: [${line.type.toUpperCase()}]\n`;
                if (line.content1) {
                    report += `  文件1: ${line.content1}\n`;
                }
                if (line.content2) {
                    report += `  文件2: ${line.content2}\n`;
                }
                report += '\n';
            }
        });
        
        return report;
    }
    
    clearAll() {
        this.file1Data = null;
        this.file2Data = null;
        this.comparisonResult = null;
        
        document.getElementById('file1').value = '';
        document.getElementById('file2').value = '';
        
        this.uiController.clearFileInfo(1);
        this.uiController.clearFileInfo(2);
        this.uiController.hideResults();
        
        this.updateCompareButton();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new HexCompareApp();
});
