export class HexComparator {
    constructor() {
        this.hexPattern = /[0-9A-Fa-f]/;
    }
    
    compare(lines1, lines2) {
        const maxLines = Math.max(lines1.length, lines2.length);
        const comparisonLines = [];
        let stats = {
            same: 0,
            different: 0,
            added: 0,
            removed: 0,
            total: maxLines,
            similarity: 0
        };
        
        for (let i = 0; i < maxLines; i++) {
            const line1 = lines1[i] || null;
            const line2 = lines2[i] || null;
            
            let lineResult = {
                lineNumber: i + 1,
                content1: line1,
                content2: line2,
                type: 'same',
                byteDiffs: []
            };
            
            if (line1 === null && line2 !== null) {
                lineResult.type = 'added';
                stats.added++;
            } else if (line1 !== null && line2 === null) {
                lineResult.type = 'removed';
                stats.removed++;
            } else if (line1 === line2) {
                lineResult.type = 'same';
                stats.same++;
            } else {
                lineResult.type = 'different';
                lineResult.byteDiffs = this.findByteDifferences(line1, line2);
                stats.different++;
            }
            
            comparisonLines.push(lineResult);
        }
        
        stats.similarity = Math.round((stats.same / stats.total) * 100);
        
        return {
            lines: comparisonLines,
            stats: stats
        };
    }
    
    findByteDifferences(line1, line2) {
        const bytes1 = this.extractHexBytes(line1);
        const bytes2 = this.extractHexBytes(line2);
        const maxLength = Math.max(bytes1.length, bytes2.length);
        const differences = [];
        
        for (let i = 0; i < maxLength; i++) {
            const byte1 = bytes1[i] || '';
            const byte2 = bytes2[i] || '';
            
            if (byte1 !== byte2) {
                differences.push({
                    position: i,
                    byte1: byte1,
                    byte2: byte2
                });
            }
        }
        
        return differences;
    }
    
    extractHexBytes(line) {
        if (!line) return [];
        
        // Intel HEX 格式解析
        if (line.startsWith(':')) {
            return this.parseIntelHex(line);
        }
        
        // Motorola S-Record 格式解析
        if (line.startsWith('S')) {
            return this.parseMotorolaS(line);
        }
        
        // 通用十六进制数据解析
        return this.parseGenericHex(line);
    }
    
    parseIntelHex(line) {
        // Intel HEX 格式: :LLAAAATTDD...DDCC
        // LL = 数据长度, AAAA = 地址, TT = 记录类型, DD = 数据, CC = 校验和
        if (line.length < 11) return [];
        
        const bytes = [];
        for (let i = 1; i < line.length; i += 2) {
            if (i + 1 < line.length) {
                bytes.push(line.substr(i, 2).toUpperCase());
            }
        }
        return bytes;
    }
    
    parseMotorolaS(line) {
        // Motorola S-Record 格式: STLLAAAA...AAADD...DDCC
        // S = 起始字符, T = 类型, LL = 长度, AAAA = 地址, DD = 数据, CC = 校验和
        if (line.length < 8) return [];
        
        const bytes = [];
        for (let i = 2; i < line.length; i += 2) {
            if (i + 1 < line.length) {
                bytes.push(line.substr(i, 2).toUpperCase());
            }
        }
        return bytes;
    }
    
    parseGenericHex(line) {
        // 通用格式：提取所有十六进制字节
        const bytes = [];
        const cleanLine = line.replace(/[^0-9A-Fa-f]/g, '');
        
        for (let i = 0; i < cleanLine.length; i += 2) {
            if (i + 1 < cleanLine.length) {
                bytes.push(cleanLine.substr(i, 2).toUpperCase());
            } else if (i < cleanLine.length) {
                bytes.push(cleanLine.substr(i, 1).toUpperCase());
            }
        }
        
        return bytes;
    }
    
    calculateChecksum(bytes) {
        let sum = 0;
        bytes.forEach(byte => {
            sum += parseInt(byte, 16);
        });
        return (0x100 - (sum & 0xFF)) & 0xFF;
    }
    
    validateIntelHex(line) {
        if (!line.startsWith(':') || line.length < 11) {
            return false;
        }
        
        const bytes = this.parseIntelHex(line);
        if (bytes.length < 5) return false;
        
        const dataLength = parseInt(bytes[0], 16);
        const expectedLength = dataLength + 5; // 长度 + 地址(2) + 类型 + 校验和
        
        return bytes.length === expectedLength;
    }
}
