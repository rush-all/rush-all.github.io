export class UIController {
    constructor() {
        this.fileHandler = null;
    }
    
    updateFileInfo(fileNumber, file, lineCount) {
        const statusElement = document.getElementById(`file${fileNumber}-status`);
        const infoElement = document.getElementById(`file${fileNumber}-info`);
        const nameElement = document.getElementById(`file${fileNumber}-name`);
        const sizeElement = document.getElementById(`file${fileNumber}-size`);
        const linesElement = document.getElementById(`file${fileNumber}-lines`);
        
        statusElement.textContent = '已选择';
        statusElement.classList.remove('text-gray-500');
        statusElement.classList.add('text-green-600', 'font-semibold');
        
        nameElement.textContent = file.name;
        sizeElement.textContent = this.formatFileSize(file.size);
        linesElement.textContent = lineCount;
        
        infoElement.classList.remove('hidden');
        infoElement.classList.add('fade-in');
    }
    
    clearFileInfo(fileNumber) {
        const statusElement = document.getElementById(`file${fileNumber}-status`);
        const infoElement = document.getElementById(`file${fileNumber}-info`);
        
        statusElement.textContent = '未选择文件';
        statusElement.classList.remove('text-green-600', 'font-semibold');
        statusElement.classList.add('text-gray-500');
        
        infoElement.classList.add('hidden');
    }
    
    displayStats(stats) {
        document.getElementById('same-lines').textContent = stats.same;
        document.getElementById('diff-lines').textContent = stats.different;
        document.getElementById('added-lines').textContent = stats.added;
        document.getElementById('removed-lines').textContent = stats.removed;
        
        const statsSection = document.getElementById('stats-section');
        statsSection.classList.remove('hidden');
        statsSection.classList.add('fade-in');
    }
    
    displayComparison(lines, diffOnly = false) {
        const resultSection = document.getElementById('result-section');
        const comparisonResult = document.getElementById('comparison-result');
        
        const filteredLines = diffOnly 
            ? lines.filter(line => line.type !== 'same')
            : lines;
        
        let html = '<div class="comparison-header">';
        html += '<div class="line-number">行号</div>';
        html += '<div>文件 1</div>';
        html += '<div>文件 2</div>';
        html += '</div>';
        
        filteredLines.forEach(line => {
            html += this.renderComparisonLine(line);
        });
        
        comparisonResult.innerHTML = html;
        resultSection.classList.remove('hidden');
        resultSection.classList.add('fade-in');
        
        // 更新按钮状态
        this.updateFilterButtons(diffOnly);
    }
    
    renderComparisonLine(line) {
        let html = '<div class="comparison-line">';
        html += `<div class="line-number">${line.lineNumber}</div>`;
        
        const typeClass = `line-${line.type}`;
        
        if (line.type === 'added') {
            html += '<div class="line-content line-same"></div>';
            html += `<div class="line-content ${typeClass}">${this.escapeHtml(line.content2)}</div>`;
        } else if (line.type === 'removed') {
            html += `<div class="line-content ${typeClass}">${this.escapeHtml(line.content1)}</div>`;
            html += '<div class="line-content line-same"></div>';
        } else if (line.type === 'different') {
            html += `<div class="line-content ${typeClass}">${this.highlightDifferences(line.content1, line.byteDiffs, 1)}</div>`;
            html += `<div class="line-content ${typeClass}">${this.highlightDifferences(line.content2, line.byteDiffs, 2)}</div>`;
        } else {
            html += `<div class="line-content ${typeClass}">${this.escapeHtml(line.content1)}</div>`;
            html += `<div class="line-content ${typeClass}">${this.escapeHtml(line.content2)}</div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    highlightDifferences(content, byteDiffs, fileNumber) {
        if (!content || byteDiffs.length === 0) {
            return this.escapeHtml(content);
        }
        
        // 简单的字节级高亮
        let result = '';
        let lastIndex = 0;
        
        // 对于Intel HEX格式，按字节对高亮
        if (content.startsWith(':')) {
            for (let i = 1; i < content.length; i += 2) {
                const byte = content.substr(i, 2);
                const byteIndex = Math.floor((i - 1) / 2);
                const isDiff = byteDiffs.some(diff => diff.position === byteIndex);
                
                if (isDiff) {
                    result += `<span class="hex-byte-diff">${this.escapeHtml(byte)}</span>`;
                } else {
                    result += `<span class="hex-byte">${this.escapeHtml(byte)}</span>`;
                }
            }
            return ':' + result;
        }
        
        // 对于其他格式，简单高亮不同的部分
        const minLength = Math.min(content.length, 100); // 限制比较长度
        for (let i = 0; i < minLength; i++) {
            const char = content[i];
            result += this.escapeHtml(char);
        }
        
        if (content.length > minLength) {
            result += '...';
        }
        
        return result;
    }
    
    updateFilterButtons(diffOnly) {
        const showAllBtn = document.getElementById('show-all-btn');
        const showDiffBtn = document.getElementById('show-diff-btn');
        
        if (diffOnly) {
            showAllBtn.classList.remove('bg-indigo-600', 'text-white');
            showAllBtn.classList.add('bg-gray-200', 'text-gray-700');
            showDiffBtn.classList.remove('bg-gray-200', 'text-gray-700');
            showDiffBtn.classList.add('bg-indigo-600', 'text-white');
        } else {
            showAllBtn.classList.remove('bg-gray-200', 'text-gray-700');
            showAllBtn.classList.add('bg-indigo-600', 'text-white');
            showDiffBtn.classList.remove('bg-indigo-600', 'text-white');
            showDiffBtn.classList.add('bg-gray-200', 'text-gray-700');
        }
    }
    
    hideResults() {
        document.getElementById('stats-section').classList.add('hidden');
        document.getElementById('result-section').classList.add('hidden');
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}
