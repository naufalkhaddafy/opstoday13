<tr>
    <td colspan="{{ $columns }}" style="background-color: #f1f5f9; color: #334155; font-size: 12px; height: 30px; vertical-align: middle;">
        Work Groups: {{ !empty($selectedWorkGroups) ? implode(', ', $selectedWorkGroups) : 'All work groups' }}
    </td>
</tr>
