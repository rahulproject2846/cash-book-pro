/**
 * 🚨 CONFLICT TAXONOMY MAPPER
 * ---------------------------------
 * Aligns Sync Engine terminology with Modal terminology
 * Ensures consistent conflict type handling across the system
 */

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
