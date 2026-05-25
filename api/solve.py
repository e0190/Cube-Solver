import json

def handler(event, context):
    try:
        method = event.get('httpMethod', 'POST')
        
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': ''
            }

        body_content = event.get('body', '')
        if not body_content:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Empty body received'})
            }

        data = json.loads(body_content)
        cube_string = data.get('cube', '')

        if len(cube_string) != 54:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': f'Incomplete matrix mapping string length: {len(cube_string)}/54'})
            }

        import rubik_solver.utils as utils
        solution = utils.solve(cube_string, 'Kociemba')
        move_list = [str(move) for move in solution]

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'moves': move_list})
        }

    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Invalid layout arrangement profile or illegal core alignments.'})
        }
