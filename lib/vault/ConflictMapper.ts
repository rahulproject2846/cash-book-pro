/**
 * 🚨 CONFLICT TAXONOMY MAPPER
 * ---------------------------------
 * Aligns Sync Engine terminology with Modal terminology
 * Ensures consistent conflict type handling across the system
 */

// 🎯 FIELD DIFF INTERFACE
export interface FieldDiff {
    field: string;
    oldValue: any;
    newValue: any;
}

// 🎯 FIELD DIFFING LOGIC: Calculate exact changes between records
export const calculateFieldDiff = (local: any, server: any): FieldDiff[] => {
    const changes: FieldDiff[] = [];
    const allKeys = new Set([...Object.keys(local || {}), ...Object.keys(server || {})]);
    
    for (const key of allKeys) {
        const localValue = local?.[key];
        const serverValue = server?.[key];
        
        // Skip system fields that don't represent user changes
        if (key === 'localId' || key === '_id' || key === 'updatedAt' || key === 'synced') {
            continue;
        }
        
        // Check for actual value differences
        if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
            changes.push({
                field: key,
                oldValue: localValue,
                newValue: serverValue
            });
        }
    }
    
    return changes;
};

// 🚨 CONFLICT TYPE MAPPING
export const mapConflictType = (reason: string): 'version' | 'parent_deleted' => {
    switch (reason) {
        case 'VERSION_CONFLICT':
            return 'version';
            
        case 'PARENT_DELETED_CHILDREN_EXIST':
            return 'parent_deleted';
            
        case 'FIELD_LEVEL_CONFLICT':
            return 'version';  // 🚨 FIELD CONFLICTS TREATED AS VERSION CONFLICTS
            
        default:
            return 'version';  // 🚨 DEFAULT TO VERSION CONFLICT
    }
};

export const reverseMapConflictType = (type: 'version' | 'parent_deleted'): string => {
    switch (type) {
        case 'version':
            return 'VERSION_CONFLICT';
            
        case 'parent_deleted':
            return 'PARENT_DELETED_CHILDREN_EXIST';
            
        default:
            return 'VERSION_CONFLICT';
    }
};

// 🚨 CONFLICT REASON VALIDATION
export const isValidConflictReason = (reason: string): boolean => {
    const validReasons = [
        'VERSION_CONFLICT',
        'PARENT_DELETED_CHILDREN_EXIST',
        'FIELD_LEVEL_CONFLICT'
    ];
    
    return validReasons.includes(reason);
};

// 🚨 CONFLICT TYPE VALIDATION
export const isValidConflictType = (type: string): boolean => {
    const validTypes = ['version', 'parent_deleted'];
    return validTypes.includes(type);
};
