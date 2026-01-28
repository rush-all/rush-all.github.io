export class FileHandler {
    constructor() {
        this.supportedExtensions = ['.hex', '.txt'];
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            if (!this.isValidFile(file)) {
                reject(new Error('不支持的文件格式，请上传 .hex 或 .txt 文件'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }
    
    isValidFile(file) {
        const fileName = file.name.toLowerCase();
        return this.supportedExtensions.some(ext => fileName.endsWith(ext));
    }
    
    parseHexFile(content) {
        const lines = content.split(/\r?\n/);
        return lines
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}
